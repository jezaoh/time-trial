/* ===== Base: DOM, canvas e dados de interface =====
   Referências do DOM, tamanho lógico do canvas (1536x864), tabela de recortes da imagem de nutrição (NUT) e índices dos ícones.
*/
const $=id=>document.getElementById(id),c=$('game'),ctx=c.getContext('2d',{alpha:false}),W=1536,H=864,SS=W/1672,IMG={},nickEl=$('nick');
const NUT=[[0,2,99,240],[99,2,100,240],[199,2,99,240],[298,2,99,240],[397,2,100,240],[497,2,100,240],[597,28,121,214]];
// versão: data e hora da montagem (preenchida por tools/montar_arquivo_unico.py; aparece no canto da tela inicial)
const VERSAO='dev';
// fonte do jogo: Exo 2 itálico (900 títulos e números · 800 textos)
const FT=(w,s)=>`italic ${w} ${s}px Exo2,system-ui,sans-serif`;
const ICON={clock:0,flag:1,avg:2,speed:3,up:4,flat:5,down:6};
