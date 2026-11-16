<?php
/**
 * Time Trial V2 — lógica do ranking, sem depender do WordPress (assim dá para testar fora dele).
 * O "store" é qualquer objeto com: get_row, save, rank_of, top, count.
 */
if ( ! defined( 'TT2_CORE_LOADED' ) ) {
define( 'TT2_CORE_LOADED', 1 );

class TT2_Core {
	const SCALE     = 75;      // 1 segundo real = 75 segundos de tempo de jogo
	const MIN_T     = 4500;    // V2: abaixo disso é impossível (50 km a mais de 40 km/h; o melhor simulado é ~34,2 km/h)
	const MAX_T     = 40000;
	const TOKEN_TTL = 10800;   // 3 h
	const CHARS     = array( 'branco' );   // V2: só o ciclista branco

	public static function valid_uid( $u ) {
		return is_string( $u ) && preg_match( '/^[a-f0-9\-]{36}$/', $u ) === 1;
	}

	public static function sign( $secret, $ts, $uid ) {
		return hash_hmac( 'sha256', $ts . '|' . $uid, $secret );
	}

	public static function make_token( $secret, $uid, $now ) {
		return $now . '.' . self::sign( $secret, $now, $uid );
	}

	/** Devolve o timestamp do token, ou uma string de erro. */
	public static function check_token( $secret, $uid, $token, $t, $now ) {
		if ( ! is_string( $token ) || strpos( $token, '.' ) === false ) {
			return 'token_invalido';
		}
		list( $ts, $sig ) = explode( '.', $token, 2 );
		if ( ! ctype_digit( $ts ) ) {
			return 'token_invalido';
		}
		$ts = (int) $ts;
		if ( ! hash_equals( self::sign( $secret, $ts, $uid ), (string) $sig ) ) {
			return 'token_invalido';
		}
		$age = $now - $ts;
		if ( $age < 0 || $age > self::TOKEN_TTL ) {
			return 'token_expirado';
		}
		// A corrida precisa ter durado, em tempo real, pelo menos t / 75 (com folga).
		if ( $age < ( $t / self::SCALE ) * 0.85 - 3 ) {
			return 'rapido_demais';
		}
		return $ts;
	}

	public static function clean_nick( $n ) {
		if ( ! is_string( $n ) ) {
			return '';
		}
		$n = trim( preg_replace( '/\s+/u', ' ', $n ) );
		if ( $n === '' || mb_strlen( $n ) > 8 ) {
			return '';
		}
		if ( preg_match( '/^[\p{L}\p{N} _.\-]+$/u', $n ) !== 1 ) {
			return '';
		}
		return $n;
	}

	public static function bad_nick( $n ) {
		$s = mb_strtolower( $n );
		$s = strtr( $s, array( 'á'=>'a','à'=>'a','â'=>'a','ã'=>'a','é'=>'e','ê'=>'e','í'=>'i','ó'=>'o','ô'=>'o','õ'=>'o','ú'=>'u','ç'=>'c',
			'0'=>'o','1'=>'i','3'=>'e','4'=>'a','5'=>'s','7'=>'t','@'=>'a','$'=>'s' ) );
		$s = preg_replace( '/[^a-z]/', '', $s );
		if ( in_array( $s, array( 'cu', 'pau', 'pnc', 'vsf', 'tnc', 'fdp' ), true ) ) {
			return true;
		}
		foreach ( array( 'puta', 'merda', 'caralho', 'porra', 'buceta', 'viado', 'nazi', 'hitler', 'fuck', 'shit', 'nigg', 'cuzao', 'arrombad', 'estupr' ) as $w ) {
			if ( strpos( $s, $w ) !== false ) {
				return true;
			}
		}
		return false;
	}

	public static function handle_start( $secret, $in, $now ) {
		$uid = isset( $in['uid'] ) ? $in['uid'] : '';
		if ( ! self::valid_uid( $uid ) ) {
			return array( 400, array( 'ok' => false, 'error' => 'uid_invalido' ) );
		}
		return array( 200, array( 'ok' => true, 'token' => self::make_token( $secret, $uid, $now ) ) );
	}

	public static function handle_score( $store, $secret, $in, $now ) {
		$uid   = isset( $in['uid'] ) ? $in['uid'] : '';
		$token = isset( $in['token'] ) ? $in['token'] : '';
		$ch    = isset( $in['ch'] ) ? $in['ch'] : '';
		$nick  = self::clean_nick( isset( $in['nick'] ) ? $in['nick'] : '' );
		$t     = isset( $in['t'] ) && is_numeric( $in['t'] ) ? (int) round( $in['t'] ) : 0;
		if ( ! self::valid_uid( $uid ) ) {
			return array( 400, array( 'ok' => false, 'error' => 'uid_invalido' ) );
		}
		if ( $nick === '' ) {
			return array( 400, array( 'ok' => false, 'error' => 'nick_invalido' ) );
		}
		if ( self::bad_nick( $nick ) ) {
			return array( 400, array( 'ok' => false, 'error' => 'nick_bloqueado' ) );
		}
		if ( ! in_array( $ch, self::CHARS, true ) ) {
			return array( 400, array( 'ok' => false, 'error' => 'personagem_invalido' ) );
		}
		if ( $t < self::MIN_T || $t > self::MAX_T ) {
			return array( 400, array( 'ok' => false, 'error' => 'tempo_invalido' ) );
		}
		$ts = self::check_token( $secret, $uid, $token, $t, $now );
		if ( ! is_int( $ts ) ) {
			return array( 400, array( 'ok' => false, 'error' => $ts ) );
		}
		$row = $store->get_row( $uid );
		if ( $row && $ts <= (int) $row['last_ts'] ) {
			return array( 400, array( 'ok' => false, 'error' => 'token_usado' ) );
		}
		$improved = ! $row || $t < (int) $row['t'];
		$store->save( $uid, $nick, $t, $ch, $ts, $improved, $now );
		$best = $improved ? $t : (int) $row['t'];
		return array( 200, array( 'ok' => true, 'pos' => $store->rank_of( $best ), 'best' => $best, 'improved' => $improved, 'total' => $store->count() ) );
	}

	public static function handle_ranking( $store, $in ) {
		$uid = isset( $in['uid'] ) ? $in['uid'] : '';
		$top = array();
		$prev_t = null;
		$prev_pos = 0;
		foreach ( $store->top( 10 ) as $i => $r ) {
			$pos = ( $prev_t !== null && (int) $r['t'] === $prev_t ) ? $prev_pos : $i + 1;
			$prev_t = (int) $r['t'];
			$prev_pos = $pos;
			$top[] = array(
				'pos'  => $pos,
				'nick' => $r['nick'],
				't'    => (int) $r['t'],
				'ch'   => $r['ch'],
				'me'   => self::valid_uid( $uid ) && $r['uid'] === $uid,
			);
		}
		$me = null;
		if ( self::valid_uid( $uid ) ) {
			$row = $store->get_row( $uid );
			if ( $row ) {
				$me = array( 'pos' => $store->rank_of( (int) $row['t'] ), 'nick' => $row['nick'], 't' => (int) $row['t'], 'ch' => $row['ch'], 'me' => true );
			}
		}
		return array( 200, array( 'ok' => true, 'top' => $top, 'me' => $me, 'total' => $store->count() ) );
	}
}
}
