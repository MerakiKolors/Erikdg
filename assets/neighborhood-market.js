(() => {
  const market = document.querySelector('[data-market]');
  const text = (en, es) => document.documentElement.lang === 'es' ? es : en;
  const formats = ['en-US', 'es-US'].map(locale => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }));
  const format = value => text(...formats).format(value);
  const metrics = [
    { key: 'UNITS', labels: ['Closed transactions', 'Operaciones cerradas'] },
    { key: 'AVERAGE_PRICE', labels: ['Average closing price', 'Precio promedio de cierre'], usd: true },
    { key: 'AVERAGE_PRICE_PER_SQFT', labels: ['Average price / sq ft', 'Precio promedio / pie²'], usd: true },
    { key: 'AVERAGE_DAYS_ON_MARKET', labels: ['Average days on market', 'Días promedio en el mercado'] }
  ];
  const status = market.querySelector('[data-status]');
  const period = market.querySelector('[data-period]');
  const cards = market.querySelector('.market-metrics');
  const plot = market.querySelector('.market-plot');
  const canvas = plot.querySelector('canvas');
  const output = plot.querySelector('output');
  const details = market.querySelector('.market-data');
  const message = market.querySelector('.market-message');
  const context = canvas.getContext('2d');
  let data;
  let selected = metrics[0];
  let points = [];
  let highlighted = -1;
  let chartPositions = [];

  function valueLabel(value, metric) {
    if (value === null) return '—';
    return (metric.usd ? text('$', 'US$') : '') + format(value);
  }

  function appendCell(row, tag, value) {
    const cell = document.createElement(tag);
    cell.textContent = value;
    row.append(cell);
    return cell;
  }

  function buildTable(rows) {
    const table = document.createElement('table');
    const header = table.createTHead().insertRow();
    appendCell(header, 'th', text('Date', 'Fecha')).scope = 'col';
    for (const metric of metrics) appendCell(header, 'th', text(...metric.labels)).scope = 'col';
    const body = table.createTBody();
    for (const [label, figures] of rows) {
      const row = body.insertRow();
      appendCell(row, 'th', label).scope = 'row';
      for (const metric of metrics) appendCell(row, 'td', valueLabel(figures[metric.key] ?? null, metric));
    }
    market.querySelector('.market-table').replaceChildren(table);
  }

  function drawChart() {
    if (!context || !points.length || plot.hidden) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.scale(scale, scale);
    const observed = points.map(([, value]) => value).filter(value => value !== null);
    const max = Math.max(1, ...observed);
    const step = Math.pow(10, Math.floor(Math.log10(max)));
    const ceiling = Math.ceil(max / step * 2) * step / 2;
    const left = width < 390 ? 69 : 96;
    const top = 18;
    const bottom = height - 40;
    const chartWidth = width - left - 14;
    context.font = '12px Futura, Arial, sans-serif';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    for (let tick = 0; tick <= 4; tick++) {
      const y = bottom - (bottom - top) * tick / 4;
      context.strokeStyle = '#49443a';
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(width - 14, y);
      context.stroke();
      context.fillStyle = '#f7f5ef';
      const value = ceiling * tick / 4;
      const axis = selected.usd && value >= 1000
        ? (value >= 1000000 ? format(value / 1000000) + 'M' : format(value / 1000) + 'k')
        : format(value);
      context.fillText((selected.usd ? '$' : '') + axis, left - 7, y);
    }

    chartPositions = points.map(([label, value], index) => {
      const x = left + chartWidth * index / Math.max(1, points.length - 1);
      return { x, y: value === null ? null : bottom - (bottom - top) * value / ceiling, label };
    });
    const interval = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(chartWidth / 78))));
    context.textAlign = 'center';
    for (const [index, { x, label }] of chartPositions.entries()) {
      if (index % interval === 0) context.fillText(label, x, bottom + 18, 75);
    }

    context.strokeStyle = '#c89733';
    context.lineWidth = 2;
    context.beginPath();
    let connected = false;
    for (const { x, y } of chartPositions) {
      if (y === null) {
        connected = false;
        continue;
      }
      if (connected) context.lineTo(x, y);
      else context.moveTo(x, y);
      connected = true;
    }
    context.stroke();
    context.fillStyle = '#c89733';
    for (const [index, { x, y }] of chartPositions.entries()) {
      if (y === null) continue;
      context.beginPath();
      context.arc(x, y, index === highlighted ? 5 : 2.7, 0, Math.PI * 2);
      context.fill();
    }
  }

  function render() {
    const group = data[status.value][period.value];
    const rows = new Map(group.UNITS.points.map(([label, value]) => [label, { UNITS: value }]));
    for (const metric of metrics.slice(1)) {
      for (const [label, value] of group[metric.key].points) {
        const row = rows.get(label);
        if (row && row.UNITS > 0 && value > 0) row[metric.key] = value;
      }
    }
    points = [...rows].map(([label, figures]) => [label, figures[selected.key] ?? null]);
    highlighted = -1;
    output.textContent = text(...selected.labels);
    for (const [index, button] of [...cards.children].entries()) {
      const metric = metrics[index];
      button.querySelector('span').textContent = text(...metric.labels);
      const [summary, annualChange] = group[metric.key].summary;
      const closed = Number(group.UNITS.summary[0].replaceAll(',', ''));
      const amount = Number(summary.replaceAll(',', ''));
      const hasValue = metric.key === 'UNITS' || (closed > 0 && amount > 0);
      button.setAttribute('aria-pressed', String(metric === selected));
      button.querySelector('strong').textContent = valueLabel(hasValue ? amount : null, metric);
      button.querySelector('small').textContent = hasValue && annualChange !== null
        ? text(annualChange + '% year over year', annualChange + '% interanual')
        : '';
    }
    buildTable(rows);
    plot.hidden = !context;
    details.hidden = false;
    message.hidden = true;
    drawChart();
  }

  for (const metric of metrics) {
    const button = document.createElement('button');
    button.type = 'button';
    const label = document.createElement('span');
    label.textContent = text(...metric.labels);
    button.append(label, document.createElement('strong'), document.createElement('small'));
    button.addEventListener('click', () => {
      selected = metric;
      render();
    });
    cards.append(button);
  }
  cards.hidden = true;
  canvas.addEventListener('pointermove', event => {
    const pointer = event.clientX - canvas.getBoundingClientRect().left;
    const nearest = chartPositions.findIndex(({ x }, index) =>
      index === chartPositions.length - 1 || pointer < (x + chartPositions[index + 1].x) / 2
    );
    if (nearest < 0) return;
    highlighted = nearest;
    const [label, value] = points[nearest];
    output.textContent = label + ' · ' + valueLabel(value, selected);
    drawChart();
  });
  canvas.addEventListener('pointerleave', () => {
    highlighted = -1;
    output.textContent = text(...selected.labels);
    drawChart();
  });

  fetch(market.dataset.market).then(response => {
    if (!response.ok) throw new Error('Market data unavailable');
    return response.json();
  }).then(snapshot => {
    data = snapshot;
    cards.hidden = false;
    status.addEventListener('change', render);
    period.addEventListener('change', render);
    new ResizeObserver(drawChart).observe(canvas);
    new MutationObserver(render).observe(document.documentElement, { attributeFilter: ['lang'] });
    render();
  }).catch(() => {
    cards.hidden = true;
    plot.hidden = true;
    details.hidden = true;
    message.hidden = false;
    message.textContent = text('Historical data could not be loaded.', 'No se pudieron cargar los datos históricos.');
  });
})();
