(() => {
  const mortgageForm=document.querySelector('.mortgage-form');
  const mortgageFields=mortgageForm.elements;
  const mortgageTotal=document.querySelector('.mortgage-total');
  const mortgageChart=document.querySelector('.mortgage-chart');
  const mortgageParts=[
    ['principal','#d8ad58'],
    ['tax','#a9844b'],
    ['hoa','#eee2c6'],
    ['insurance','#8e9999'],
    ['pmi','#6a765e']
  ].map(([key,color])=>{
    const element=document.querySelector(`[data-payment="${key}"]`);
    element.parentElement.style.setProperty('--slice-color',color);
    return {key,color,element};
  });

  function updateMortgage(){
    const price=mortgageFields.price.valueAsNumber;
    const down=mortgageFields.downAmount.valueAsNumber;
    const annualRate=mortgageFields.interest.valueAsNumber;
    const months=Number(mortgageFields.term.value)*12;
    mortgageFields.downAmount.max=Number.isFinite(price)?String(price):'';
    if(!mortgageForm.checkValidity()){
      mortgageTotal.textContent='—';
      for(const {element} of mortgageParts)element.textContent='—';
      mortgageChart.style.removeProperty('--mortgage-slices');
      return;
    }
    const loan=price-down;
    const rate=annualRate/1200;
    const principal=rate===0?loan/months:loan*rate/(-Math.expm1(-months*Math.log1p(rate)));
    const payments={
      principal,
      tax:mortgageFields.tax.valueAsNumber/12,
      hoa:mortgageFields.hoa.valueAsNumber,
      insurance:mortgageFields.insurance.valueAsNumber/12,
      pmi:loan>0?mortgageFields.pmi.valueAsNumber:0
    };
    const total=Object.values(payments).reduce((sum,amount)=>sum+amount,0);
    const locale=document.documentElement.lang==='en'?'en-US':'es-CL';
    const dollars=new Intl.NumberFormat(locale,{maximumFractionDigits:2,minimumFractionDigits:2});
    const percent=new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:1});
    const formatMoney=amount=>'US$'+dollars.format(amount);
    mortgageTotal.textContent=formatMoney(total);
    let start=0;
    const slices=mortgageParts.map(({key,color,element})=>{
      const share=total>0?payments[key]/total:0;
      element.textContent=formatMoney(payments[key])+' ('+percent.format(share)+')';
      const slice=`${color} ${start}% ${Math.min(100,start+share*100)}%`;
      start+=share*100;
      return slice;
    });
    if(total>0)mortgageChart.style.setProperty('--mortgage-slices','conic-gradient('+slices.join(', ')+')');
    else mortgageChart.style.removeProperty('--mortgage-slices');
  }

  mortgageForm.addEventListener('input',event=>{
    const {name}=event.target;
    const price=mortgageFields.price.valueAsNumber;
    if(name==='downAmount'&&price>0&&mortgageFields.downAmount.validity.valid){
      mortgageFields.downPercent.value=String(Number((mortgageFields.downAmount.valueAsNumber/price*100).toFixed(4)));
    }else if((name==='downPercent'||name==='price')&&price>0&&mortgageFields.downPercent.validity.valid){
      mortgageFields.downAmount.value=(price*mortgageFields.downPercent.valueAsNumber/100).toFixed(2);
    }
    updateMortgage();
  });
  mortgageForm.addEventListener('submit',event=>event.preventDefault());
  mortgageForm.addEventListener('reset',()=>queueMicrotask(updateMortgage));
  let locale = document.documentElement.lang;
  new MutationObserver(() => {
    if (locale === document.documentElement.lang) return;
    locale = document.documentElement.lang;
    updateMortgage();
  }).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  updateMortgage();

})();
