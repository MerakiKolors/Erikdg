(() => {
  const modules = [...document.querySelectorAll('[data-market-area]')];
  if (!modules.length) return;
  const labels = {
    price: ['Precio medio de venta', 'Average sale price'],
    psf: ['Precio por pie²', 'Price per sq ft'],
    sales: ['Ventas cerradas', 'Closed sales'],
    days: ['Días en el mercado', 'Days on market']
  };
  fetch('assets/project-market-trends.json')
    .then(response => {
      if (!response.ok) throw new Error('Market data unavailable');
      return response.json();
    })
    .then(data => {
      for (const module of modules) {
        const region = data.regions[module.dataset.marketArea];
        if (!region) continue;
        let metric = 'price';
        const chart = module.querySelector('.market-chart');
        const status = module.querySelector('.market-status');
        function render() {
          const english = document.documentElement.lang === 'en';
          const locale = english ? 'en-US' : 'es-CL';
          const format = number => (metric === 'price' || metric === 'psf' ? 'US$' : '') + new Intl.NumberFormat(locale).format(number);
          const values = region[metric];
          const max = Math.max(...values);
          chart.replaceChildren();
          values.forEach((value, i) => {
            const row = document.createElement('div');
            row.className = 'market-bar-row';
            const period = document.createElement('span');
            period.textContent = data.periods[i];
            const track = document.createElement('div');
            track.className = 'market-bar-track';
            const bar = document.createElement('span');
            bar.className = 'market-bar';
            bar.style.width = `${value / max * 100}%`;
            track.append(bar);
            const amount = document.createElement('strong');
            amount.textContent = format(value);
            row.append(period, track, amount);
            chart.append(row);
          });
          status.textContent = labels[metric][english ? 1 : 0] + ' · ' + module.dataset.marketArea + ': ' + data.periods.map((period, i) => `${period}: ${format(values[i])}`).join(' · ');
        }
        module.querySelector('.market-controls').addEventListener('click', event => {
          const button = event.target.closest('[data-market-metric]');
          if (!button || !labels[button.dataset.marketMetric]) return;
          metric = button.dataset.marketMetric;
          module.querySelectorAll('[data-market-metric]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
          render();
        });
        let language = document.documentElement.lang;
        new MutationObserver(() => {
          if (language !== document.documentElement.lang) {
            language = document.documentElement.lang;
            render();
          }
        }).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
        render();
      }
    })
    .catch(() => {
      // The full dated comparison table remains usable without JavaScript or JSON.
      modules.forEach(module => { module.querySelector('.market-controls').hidden = true; });
    });
})();
