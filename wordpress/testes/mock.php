<?php
// Servidor de teste local: usa o mesmo core.php do plugin, com armazenamento em arquivo.
require __DIR__.'/../plugin-fonte/includes/core.php';
class FileStore { public $f; function __construct($f){$this->f=$f;} 
 function all(){return is_file($this->f)?json_decode(file_get_contents($this->f),true):array();}
 function put($a){file_put_contents($this->f,json_encode($a));}
 function get_row($u){$a=$this->all();return $a[$u]??null;}
 function save($u,$n,$t,$c,$ts,$imp,$now){$a=$this->all(); if(!isset($a[$u])||$imp)$a[$u]=array('uid'=>$u,'nick'=>$n,'t'=>$t,'ch'=>$c,'last_ts'=>$ts); else $a[$u]['last_ts']=$ts; $this->put($a);}
 function rank_of($t){$n=1;foreach($this->all() as $x)if($x['t']<$t)$n++;return $n;}
 function top($n){$a=array_values($this->all());usort($a,fn($x,$y)=>$x['t']<=>$y['t']);return array_slice($a,0,$n);}
 function count(){return count($this->all());} }
$st=new FileStore('/tmp/tt2_mock.json'); $path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
if($path==='/'||$path==='/game'){header('Content-Type: text/html');readfile(getenv('TT_GAME')?:__DIR__.'/game_test.html');exit;}
header('Content-Type: application/json'); header('Cache-Control: no-store');
$in=json_decode(file_get_contents('php://input'),true); if(!is_array($in))$in=$_GET;
if($path==='/api/ranking')$r=TT2_Core::handle_ranking($st,$in);
elseif($path==='/api/start')$r=TT2_Core::handle_start('s',$in,time());
elseif($path==='/api/score')$r=TT2_Core::handle_score($st,'s',$in,time());
else {http_response_code(404);exit;}
http_response_code($r[0]); echo json_encode($r[1]);
