import Sprite = PIXI.Sprite;
import Ticker = PIXI.ticker.Ticker;
import Graphics = PIXI.Graphics;
import {WaveForm} from "../au/WaveForm";
import {Calc} from "../tools/Calc";
import {AuEngine} from "../au/AuEngine";
import {Main} from "../Main";

type Sz={w:number, h:number};
type Val = number;// meaning from 0 to 1

const rmx=Calc.remix;
const mx=Calc.mix;

export class DispGraph extends Graphics{
  constructor(public size:Sz){
    super();
  }
  samplesToDraw=Math.floor(AuEngine.BUF_SZ);
  startFromSilenceUp=false;
  private wasZero=false;
  private fadeTick=0;
  resolution=2;
  drawFrame=()=>{
    const isZero = this.isSilense();
    let doChange=true;
    if(isZero && this.wasZero){
      if(this.fadeTick>0){
        // console.log('fading out '+this.fadeTick);
        this.fadeTick--;
        doChange=true;
      }else
        doChange= false;
    }else
      this.fadeTick=30;
    this.clear();
    if(doChange){
      this.drawBorder(this.size);
      this.drawChannel(0);
      // this.drawChannel(.0, 0);
      // this.drawChannel(.5, 1);
    }
    this.wasZero=isZero;
    return doChange;
  };
  get engine(){ return AuEngine._;}
  private isSilense=()=>{
    const buffer=this.engine.lastBuffer;
    if(typeof buffer=='undefined')return true;
    for(let i=0;i<buffer.length;++i){
      if(buffer.getChannelData(0)[i]!=0)return false;
    }
    return true;
  };
  drawBorder(sz:Sz){
    this.lineStyle(2, 0x777777, 1);
    // this.beginFill(0, .3);
    this.drawRect(0,0, sz.w, sz.h);
  };
  findTheLoudestFirstSample=(channel:number)=>{
    const buffer=this.engine.lastBuffer;
    const epsilon=.01, izZero=(v:number) =>Math.abs(v)<epsilon;
    let loudestIdx=0, loudestMax=0;
    const dat=buffer.getChannelData(channel);
    for(let i=0;i<buffer.length;++i){
      const spl=dat[i];
      if(spl>loudestMax){
        loudestMax=spl;
        loudestIdx=i;
      }
    }
    return loudestIdx;
  };
  drawChannel(channel:number){
    const sz={w:this.size.w, h:this.size.h, x:0, y:0};
    const buffer=this.engine.lastBuffer;
    if(buffer){
      let startSampleIdx=0;
      if(this.startFromSilenceUp)
        startSampleIdx=this.findTheLoudestFirstSample(channel);
      // this.beginFill(0,0);
      this.lineStyle(2, 0x33ccff, 1);
      for (let i = 0; i < sz.w; i+=this.resolution) {
        const I = Calc.unmix(0, sz.w, i);
        const sampleIdx = Math.floor(mx(0, this.samplesToDraw, I));
        const dat=buffer.getChannelData(channel);
        const idx=startSampleIdx+sampleIdx;
        if(idx>=buffer.length)continue;
        const spl= idx<buffer.length?dat[idx]:-1;
        // const y=mx(sz.y, sz.y + sz.h, spl);
        const splCurrent = Calc.unmix(-1, 1, spl);
        const y=rmx(1, -1, spl, sz.y, sz.y+sz.h);
        // console.log(i, `sz.y =${sz.y}, sz.h=${sz.h}`);
        if(i==0)this.moveTo(i, y);
        else this.lineTo(i,y);
      }
      this.endFill();
    }
  }
}