const localized = [...document.querySelectorAll('[data-en]')].map(element => ({
  element, spanish: element.textContent, english: element.dataset.en
}));
const localizedAttributes = [
  ['aria-label', 'enLabel', '[data-en-label]'],
  ['placeholder', 'enPlaceholder', '[data-en-placeholder]'],
  ['alt', 'enAlt', '[data-en-alt]']
].flatMap(([attribute, key, selector]) => [...document.querySelectorAll(selector)].map(element => ({
  element, attribute, spanish: element.getAttribute(attribute), english: element.dataset[key]
})));
const siteLinks = [...document.querySelectorAll('[data-site-link]')].map(link => ({
  link, target: link.getAttribute('href')
}));
const languageButtons = [...document.querySelectorAll('[data-project-lang]')];
const menuButton = document.querySelector('.top .menu');
const menu = document.querySelector('#nav');
const tickerButtons = [...document.querySelectorAll('.marquee-pause')];
const saveButtons = [...document.querySelectorAll('[data-save-project]')];
const favoritesKey = 'erik-building-favorites';

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}
const favorites = readFavorites();
let projectLanguage = 'en';
const local = (spanish, english) => projectLanguage === 'en' ? english : spanish;

function setMenu(open) {
  menu.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
}
menuButton.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('open')) {
    setMenu(false);
    menuButton.focus();
  }
});

function updateTickerLabel(button) {
  const paused = button.getAttribute('aria-pressed') === 'true';
  button.setAttribute('aria-label', paused
    ? local('Reanudar la cinta', 'Resume ticker')
    : local('Pausar la cinta', 'Pause ticker'));
}
tickerButtons.forEach(button => {
  button.addEventListener('click', () => {
    const paused = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(paused));
    button.closest('.property-marquee').classList.toggle('is-paused', paused);
    button.querySelector('path').setAttribute('d', paused ? 'm9 5 11 7-11 7z' : 'M9 5v14m6-14v14');
    updateTickerLabel(button);
  });
});

function updateSaveLabel(button) {
  const saved = favorites.has(button.dataset.saveProject);
  button.setAttribute('aria-pressed', String(saved));
  button.querySelector('span').textContent = saved ? local('Guardado', 'Saved') : local('Guardar', 'Save');
}
saveButtons.forEach(button => {
  button.addEventListener('click', () => {
    const id = button.dataset.saveProject;
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    try { localStorage.setItem(favoritesKey, JSON.stringify([...favorites])); } catch {}
    updateSaveLabel(button);
  });
});


const heroFinder = document.querySelector('.finder-form');
const purchaseBudgets = [1000000, 2000000, 3000000, 4000000, 5000000];
const rentalBudgets = [2500, 5000, 7500, 10000];

function updateFinderBudget(reset = false) {
  if (!heroFinder) return;
  const {market, maxPrice, lang} = heroFinder.elements;
  lang.value = projectLanguage;
  const rent = market.value === 'rent';
  const amounts = rent ? rentalBudgets : purchaseBudgets;
  const selected = reset ? '' : maxPrice.value;
  const money = new Intl.NumberFormat(projectLanguage === 'en' ? 'en-US' : 'es-CL');
  maxPrice.replaceChildren(
    new Option(local('Sin máximo', 'No max'), ''),
    ...amounts.map(amount => new Option(rent ? 'US$'+money.format(amount) : 'US$'+amount/1000000+'M', String(amount)))
  );
  maxPrice.value = amounts.includes(Number(selected)) ? selected : '';
}
heroFinder?.addEventListener('change', event => {
  if (event.target.name === 'market') updateFinderBudget(true);
});

document.querySelectorAll('.finder-fields select').forEach((select,index)=>{
 const label=select.closest('label'), field=document.createElement('div');
 field.className='finder-select-field';
 field.append(...label.childNodes);
 label.replaceWith(field);
 const caption=field.querySelector('span');
 caption.id='finder-caption-'+index;
 const trigger=document.createElement('button'), menu=document.createElement('div');
 trigger.type='button';
 trigger.className='finder-trigger';
 trigger.id='finder-trigger-'+index;
 trigger.setAttribute('aria-labelledby',caption.id+' '+trigger.id);
 trigger.setAttribute('aria-expanded','false');
 menu.id='finder-options-'+index;
 menu.className='finder-options';
 menu.hidden=true;
 trigger.setAttribute('aria-controls',menu.id);
 select.hidden=true;
 field.append(trigger,menu);
 const setOpen=open=>{
  trigger.setAttribute('aria-expanded',String(open));
  menu.hidden=!open;
 };
 const sync=()=>{
  const selectedText=select.selectedOptions[0]?.textContent||'';
  if(trigger.textContent!==selectedText)trigger.textContent=selectedText;
  if(menu.hidden)return;
  const options=Array.from(select.options);
  if(menu.children.length===options.length&&options.every((option,i)=>menu.children[i].textContent===option.textContent&&menu.children[i].getAttribute('aria-pressed')===String(option.selected)))return;
  menu.replaceChildren(...Array.from(select.options,option=>{
   const choice=document.createElement('button');
   choice.type='button';
   choice.textContent=option.textContent;
   choice.setAttribute('aria-pressed',String(option.selected));
   choice.onclick=()=>{
    select.value=option.value;
    setOpen(false);
    select.dispatchEvent(new Event('change',{bubbles:true}));
    trigger.focus();
   };
   return choice;
  }));
 };
 const open=()=>{
  setOpen(true);
  sync();
  menu.querySelector('[aria-pressed=true]')?.focus();
 };
 trigger.onclick=()=>menu.hidden?open():setOpen(false);
 field.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!menu.hidden){
   event.preventDefault();
   setOpen(false);
   trigger.focus();
  }
  if(!['ArrowDown','ArrowUp'].includes(event.key))return;
  event.preventDefault();
  if(menu.hidden){open();return;}
  const choices=Array.from(menu.children);
  const step=event.key==='ArrowDown'?1:-1;
  const next=(choices.indexOf(document.activeElement)+step+choices.length)%choices.length;
  choices[next]?.focus();
 });
 field.addEventListener('focusout',event=>{
  if(!field.contains(event.relatedTarget))setOpen(false);
 });
 document.addEventListener('click',event=>{
  if(!field.contains(event.target))setOpen(false);
 });
 select.addEventListener('change',sync);
 new MutationObserver(sync).observe(select,{childList:true,subtree:true,characterData:true});
 sync();
});

function setProjectLanguage(language, updateAddress = false) {
  projectLanguage = language;
  document.documentElement.lang = language;
  localized.forEach(({element, spanish, english}) => {
    element.textContent = local(spanish, english);
  });
  localizedAttributes.forEach(({element, attribute, spanish, english}) => {
    element.setAttribute(attribute, local(spanish, english));
  });
  languageButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.projectLang === language));
  });
  siteLinks.forEach(({link, target}) => {
    const url = new URL(target, location.href);
    if (language === 'es') url.searchParams.set('lang', 'es');
    else url.searchParams.delete('lang');
    link.href = url.href;
  });
  if (updateAddress) {
    const url = new URL(location.href);
    if (language === 'es') url.searchParams.set('lang', 'es');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
  }
  updateFinderBudget();
  tickerButtons.forEach(updateTickerLabel);
  saveButtons.forEach(updateSaveLabel);
}
languageButtons.forEach(button => {
  button.addEventListener('click', () => setProjectLanguage(button.dataset.projectLang, true));
});
setProjectLanguage(new URLSearchParams(location.search).get('lang') === 'es' ? 'es' : 'en');
