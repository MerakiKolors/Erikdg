(() => {
  const form = document.querySelector('#inquiry');
  const name = form.querySelector('#name');
  const interest = form.querySelector('#interest');
  const timing = form.querySelector('#timing');
  const message = form.querySelector('#message');
  const context = form.querySelector('#goal-context');
  const email = form.querySelector('#email-draft');
  const prompts = [
    ["Tell me what kind of property you are looking for and what matters to you.", "Cuéntame qué tipo de propiedad buscas y qué es importante para ti."],
    ["Tell me the neighborhood, property type and when you would like to sell.", "Cuéntame la zona, el tipo de propiedad y cuándo te gustaría vender."],
    ["What is your investment goal and timeframe?", "¿Qué objetivo y horizonte tienes para tu inversión?"],
    ["Where are you moving from, and what do you need from your new neighborhood?", "¿Desde dónde llegas y qué necesitas de tu nueva zona?"],
    ["What would you like to know about the residences at Aria Reserve?", "¿Qué te gustaría conocer de las residencias de Aria Reserve?"],
    ["What lifestyle and neighborhoods interest you?", "¿Qué estilo de vida y zonas te interesan?"]
  ];
  const local = (english, spanish) => document.documentElement.lang === 'es' ? spanish : english;

  function updateContext() {
    context.textContent = local(...prompts[interest.selectedIndex]);
  }

  function composeMessage() {
    const client = name.value.trim();
    return [
      local(client ? `Hi Erik, I'm ${client}.` : 'Hi Erik.', client ? `Hola Erik, soy ${client}.` : 'Hola Erik.'),
      local("I'm interested in", 'Me interesa') + ': ' + interest.selectedOptions[0].textContent + '.',
      local('My timeframe', 'Mi plazo') + ': ' + timing.selectedOptions[0].textContent + '.',
      message.value.trim()
    ].filter(Boolean).join(' ');
  }

  interest.addEventListener('change', updateContext);
  new MutationObserver(updateContext).observe(document.documentElement, { attributeFilter: ['lang'] });
  updateContext();

  email.addEventListener('click', () => {
    const subject = local('Real estate inquiry', 'Consulta inmobiliaria') + ' · ' + interest.selectedOptions[0].textContent;
    email.href = 'mailto:Erik@Parsiani.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(composeMessage());
  });

  name.addEventListener('input', () => name.setCustomValidity(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!name.value.trim()) {
      name.setCustomValidity(local('Please enter your name.', 'Escribe tu nombre.'));
      name.reportValidity();
      return;
    }
    window.open('https://wa.me/13059020139?text=' + encodeURIComponent(composeMessage()), '_blank', 'noopener,noreferrer');
  });
})();
