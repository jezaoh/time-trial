<?php
require __DIR__ . '/../plugin-fonte/includes/core.php';
class MemStore {
	public $r = array();
	function get_row($u){ return $this->r[$u] ?? null; }
	function save($u,$n,$t,$c,$ts,$imp,$now){ if(!isset($this->r[$u])||$imp){$this->r[$u]=array('uid'=>$u,'nick'=>$n,'t'=>$t,'ch'=>$c,'last_ts'=>$ts);} else {$this->r[$u]['last_ts']=$ts;} }
	function rank_of($t){ $n=1; foreach($this->r as $x) if($x['t']<$t)$n++; return $n; }
	function top($n){ $a=array_values($this->r); usort($a,fn($x,$y)=>$x['t']<=>$y['t']); return array_slice($a,0,$n); }
	function count(){ return count($this->r); }
}
$fails=0; function ok($c,$m){ global $fails; echo ($c?'OK   ':'FAIL ').$m."\n"; if(!$c)$fails++; }
$S='secret'; $st=new MemStore(); $uid='11111111-2222-3333-4444-555555555555'; $now=1000000;
[$c,$r]=TT2_Core::handle_start($S,array('uid'=>$uid),$now); ok($c==200&&$r['ok'],'start');
$tok=$r['token'];
$later=$now+5400/75+10;
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$tok,'nick'=>'Jeff','t'=>5400,'ch'=>'branco'),$later); ok($c==200&&$r['pos']==1,'score aceito pos 1');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$tok,'nick'=>'Jeff','t'=>5300,'ch'=>'branco'),$later); ok($r['error']=='token_usado','token reutilizado recusado');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>'1.abc','nick'=>'Jeff','t'=>5400,'ch'=>'branco'),$later); ok($r['error']=='token_invalido','token falso');
[$c,$r]=TT2_Core::handle_start($S,array('uid'=>$uid),$now+1000); $t2=$r['token'];
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t2,'nick'=>'Jeff','t'=>5000,'ch'=>'branco'),$now+1000+5); ok($r['error']=='rapido_demais','tempo real curto demais');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t2,'nick'=>'Jeff','t'=>100,'ch'=>'branco'),$now+2000); ok($r['error']=='tempo_invalido','tempo impossivel');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t2,'nick'=>'Jeff','t'=>5000,'ch'=>'branco'),$now+1000+5000/75+5); ok($c==200&&$r['improved']&&$r['best']==5000,'melhora tempo');
[$c,$r]=TT2_Core::handle_start($S,array('uid'=>$uid),$now+3000); $t3=$r['token'];
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t3,'nick'=>'Jeff','t'=>6000,'ch'=>'branco'),$now+3000+100); ok($c==200&&!$r['improved']&&$r['best']==5000,'pior tempo nao substitui');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t3,'nick'=>'<b>x</b>','t'=>6000,'ch'=>'branco'),$now+3200); ok($r['error']=='nick_invalido','html no nick');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t3,'nick'=>'Caralho','t'=>6000,'ch'=>'branco'),$now+3200); ok($r['error']=='nick_bloqueado','palavrao');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t3,'nick'=>'abcdefghi','t'=>6000,'ch'=>'branco'),$now+3200); ok($r['error']=='nick_invalido','nick > 8');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t3,'nick'=>'Ze','t'=>6000,'ch'=>'x'),$now+3200); ok($r['error']=='personagem_invalido','personagem');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$tok,'nick'=>'Ze','t'=>6000,'ch'=>'branco'),$now+999999); ok($r['error']=='token_expirado'||$r['error']=='token_usado','expirado');
[$c,$r]=TT2_Core::handle_ranking($st,array('uid'=>$uid)); ok($r['top'][0]['me']&&$r['me']['pos']==1&&$r['total']==1,'ranking');
// --- V2 ---
[$c,$r]=TT2_Core::handle_start($S,array('uid'=>$uid),$now+5000); $t4=$r['token'];
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t4,'nick'=>'Ze','t'=>6000,'ch'=>'azul'),$now+5000+100); ok($r['error']=='personagem_invalido','V2: só o branco (azul recusado)');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t4,'nick'=>'Ze','t'=>4400,'ch'=>'branco'),$now+5000+100); ok($r['error']=='tempo_invalido','V2: abaixo de 4500 s recusado (>40 km/h)');
[$c,$r]=TT2_Core::handle_score($st,$S,array('uid'=>$uid,'token'=>$t4,'nick'=>'Ze','t'=>5300,'ch'=>'branco'),$now+5000+5300/75+2); ok($c==200,'V2: 1:28:20 (34 km/h) aceito');
echo $fails? "$fails FALHAS\n":"TUDO OK\n"; exit($fails?1:0);
