<?php
/**
 * Plugin Name: Time Trial V2 Ranking
 * Description: Time Trial V2 (física de potência) com ranking próprio (Top 10). Abre em /timetrial-v2/ e, com o plugin da V1 desativado, também em /timetrial/ (substitui a V1 no mesmo endereço).
 * Version: 2.7.0
 * Requires PHP: 7.4
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/core.php';

class TT2_WP_Store {
	private function table() {
		global $wpdb;
		return $wpdb->prefix . 'timetrial2_scores';
	}
	public function get_row( $uid ) {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( 'SELECT uid, nick, time_s AS t, ch, last_ts FROM ' . $this->table() . ' WHERE uid = %s', $uid ), ARRAY_A );
	}
	public function save( $uid, $nick, $t, $ch, $ts, $improved, $now ) {
		global $wpdb;
		$tb  = $this->table();
		$row = $this->get_row( $uid );
		$when = gmdate( 'Y-m-d H:i:s', $now );
		if ( ! $row ) {
			$wpdb->insert( $tb, array( 'uid' => $uid, 'nick' => $nick, 'time_s' => $t, 'ch' => $ch, 'last_ts' => $ts, 'created_at' => $when ), array( '%s', '%s', '%d', '%s', '%d', '%s' ) );
		} elseif ( $improved ) {
			$wpdb->update( $tb, array( 'nick' => $nick, 'time_s' => $t, 'ch' => $ch, 'last_ts' => $ts, 'created_at' => $when ), array( 'uid' => $uid ), array( '%s', '%d', '%s', '%d', '%s' ), array( '%s' ) );
		} else {
			$wpdb->update( $tb, array( 'last_ts' => $ts ), array( 'uid' => $uid ), array( '%d' ), array( '%s' ) );
		}
	}
	public function rank_of( $t ) {
		global $wpdb;
		return 1 + (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM ' . $this->table() . ' WHERE time_s < %d', $t ) );
	}
	public function top( $n ) {
		global $wpdb;
		return (array) $wpdb->get_results( $wpdb->prepare( 'SELECT uid, nick, time_s AS t, ch FROM ' . $this->table() . ' ORDER BY time_s ASC, created_at ASC LIMIT %d', $n ), ARRAY_A );
	}
	public function count() {
		global $wpdb;
		return (int) $wpdb->get_var( 'SELECT COUNT(*) FROM ' . $this->table() );
	}
}

function tt2_install() {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$tb      = $wpdb->prefix . 'timetrial2_scores';
	$charset = $wpdb->get_charset_collate();
	dbDelta( "CREATE TABLE $tb (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  uid varchar(36) NOT NULL,
  nick varchar(32) NOT NULL,
  time_s int(10) unsigned NOT NULL,
  ch varchar(10) NOT NULL,
  last_ts bigint(20) unsigned NOT NULL DEFAULT 0,
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY uid (uid),
  KEY time_s (time_s)
) $charset;" );
	if ( ! get_option( 'tt2_secret' ) ) {
		add_option( 'tt2_secret', wp_generate_password( 64, true, true ), '', 'no' );
	}
	update_option( 'tt2_db_ver', '1' );
}
register_activation_hook( __FILE__, 'tt2_install' );

function tt2_ensure_ready() {
	if ( get_option( 'tt2_db_ver' ) !== '1' || ! get_option( 'tt2_secret' ) ) {
		tt2_install();
	}
}

/* ---------- Serve o jogo em /timetrial-v2/ e, se o plugin da V1 estiver desativado, também em /timetrial/ ---------- */
add_action( 'init', function () {
	$path = isset( $_SERVER['REQUEST_URI'] ) ? wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ), PHP_URL_PATH ) : '';
	$home = rtrim( (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH ), '/' );
	$paths = array( $home . '/timetrial-v2' );
	if ( ! function_exists( 'tt_install' ) ) {   // plugin da V1 desativado: a V2 assume o endereço antigo
		$paths[] = $home . '/timetrial';
	}
	if ( ! is_string( $path ) || ! in_array( rtrim( $path, '/' ), $paths, true ) ) {
		return;
	}
	$file = __DIR__ . '/game/index.html';
	if ( ! is_readable( $file ) ) {
		return;
	}
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
	nocache_headers();
	status_header( 200 );
	header( 'Content-Type: text/html; charset=utf-8' );
	header( 'X-Robots-Tag: noindex' );
	readfile( $file );
	exit;
}, 1 );

/* ---------- API REST ---------- */
function tt2_rate_limit( $key, $max, $window ) {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '0';
	$k  = 'tt2_rl_' . md5( $key . $ip );
	$n  = (int) get_transient( $k );
	if ( $n >= $max ) {
		return false;
	}
	set_transient( $k, $n + 1, $window );
	return true;
}

function tt2_reply( $pair ) {
	$r = new WP_REST_Response( $pair[1], $pair[0] );
	$r->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0' );
	return $r;
}

add_action( 'rest_api_init', function () {
	$args = function ( $cb, $method, $limit_key, $max ) {
		return array(
			'methods'             => $method,
			'permission_callback' => '__return_true',
			'callback'            => function ( WP_REST_Request $req ) use ( $cb, $limit_key, $max ) {
				tt2_ensure_ready();
				if ( ! tt2_rate_limit( $limit_key, $max, 600 ) ) {
					return tt2_reply( array( 429, array( 'ok' => false, 'error' => 'muitas_requisicoes' ) ) );
				}
				$in = $req->get_json_params();
				if ( ! is_array( $in ) ) {
					$in = $req->get_params();
				}
				return tt2_reply( $cb( $in ) );
			},
		);
	};
	register_rest_route( 'timetrial2/v1', '/ranking', $args( function ( $in ) {
		return TT2_Core::handle_ranking( new TT2_WP_Store(), $in );
	}, 'GET', 'rank', 300 ) );
	register_rest_route( 'timetrial2/v1', '/start', $args( function ( $in ) {
		return TT2_Core::handle_start( get_option( 'tt2_secret' ), $in, time() );
	}, 'POST', 'start', 120 ) );
	register_rest_route( 'timetrial2/v1', '/score', $args( function ( $in ) {
		return TT2_Core::handle_score( new TT2_WP_Store(), get_option( 'tt2_secret' ), $in, time() );
	}, 'POST', 'score', 40 ) );
} );

/* ---------- Admin: Ferramentas > Time Trial Ranking ---------- */
add_action( 'admin_menu', function () {
	add_management_page( 'Time Trial V2 Ranking', 'Time Trial V2 Ranking', 'manage_options', 'tt2-ranking', 'tt2_admin_page' );
} );

function tt2_fmt( $t ) {
	$h = intdiv( $t, 3600 );
	$m = intdiv( $t % 3600, 60 );
	$s = $t % 60;
	return sprintf( '%d:%02d:%02d', $h, $m, $s );
}

function tt2_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	tt2_ensure_ready();
	global $wpdb;
	$tb = $wpdb->prefix . 'timetrial2_scores';
	if ( isset( $_POST['tt2_del'] ) && check_admin_referer( 'tt2_del_' . (int) $_POST['tt2_del'] ) ) {
		$wpdb->delete( $tb, array( 'id' => (int) $_POST['tt2_del'] ), array( '%d' ) );
		echo '<div class="notice notice-success"><p>Removido.</p></div>';
	}
	if ( isset( $_POST['tt2_clear'] ) && check_admin_referer( 'tt2_clear' ) ) {
		$wpdb->query( "TRUNCATE TABLE $tb" );
		echo '<div class="notice notice-success"><p>Ranking zerado.</p></div>';
	}
	$rows = $wpdb->get_results( "SELECT id, nick, time_s, ch, created_at FROM $tb ORDER BY time_s ASC LIMIT 200", ARRAY_A );
	echo '<div class="wrap"><h1>Time Trial V2 Ranking</h1>';
	$url = function_exists( 'tt_install' ) ? home_url( '/timetrial-v2/' ) : home_url( '/timetrial/' );
	echo '<p>Jogo: <a href="' . esc_url( $url ) . '" target="_blank">' . esc_html( $url ) . '</a>' . ( function_exists( 'tt_install' ) ? ' &mdash; o plugin da V1 ainda está ativo; desative-o para a V2 abrir também em /timetrial/.' : '' ) . '</p>';
	echo '<table class="widefat striped" style="max-width:720px"><thead><tr><th>#</th><th>Apelido</th><th>Tempo</th><th>Ciclista</th><th>Data (UTC)</th><th></th></tr></thead><tbody>';
	if ( ! $rows ) {
		echo '<tr><td colspan="6">Ainda sem registros.</td></tr>';
	}
	foreach ( $rows as $i => $r ) {
		echo '<tr><td>' . ( $i + 1 ) . '</td><td>' . esc_html( $r['nick'] ) . '</td><td>' . esc_html( tt2_fmt( (int) $r['time_s'] ) ) . '</td><td>' . esc_html( $r['ch'] ) . '</td><td>' . esc_html( $r['created_at'] ) . '</td><td><form method="post">';
		wp_nonce_field( 'tt2_del_' . (int) $r['id'] );
		echo '<input type="hidden" name="tt2_del" value="' . (int) $r['id'] . '"><button class="button button-small">Remover</button></form></td></tr>';
	}
	echo '</tbody></table><form method="post" style="margin-top:16px" onsubmit="return confirm(\'Apagar TODO o ranking?\')">';
	wp_nonce_field( 'tt2_clear' );
	echo '<button class="button" name="tt2_clear" value="1">Zerar ranking</button></form></div>';
}
