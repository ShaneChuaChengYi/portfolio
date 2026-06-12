/* EAE Portfolio — interactive spreadsheet viewer
   Loads an .xlsx file with SheetJS and renders it as a scrollable table.
   Drop your real spreadsheet at:  data/BloxFruit_Business_Analytics.xlsx
   If the file can't be loaded, the screenshot fallback stays visible. */

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('sheet-viewer');
  if (!mount || typeof XLSX === 'undefined') return;

  const FILE = mount.dataset.src || '../data/BloxFruit_Business_Analytics.xlsx';
  const fallback = document.getElementById('sheet-fallback');

  fetch(FILE)
    .then(res => {
      if (!res.ok) throw new Error('not found');
      return res.arrayBuffer();
    })
    .then(buf => {
      const wb = XLSX.read(buf, { type: 'array' });
      render(wb);
      if (fallback) fallback.style.display = 'none';
      mount.style.display = 'block';
    })
    .catch(() => {
      /* keep the screenshot fallback; viewer stays hidden */
      mount.style.display = 'none';
    });

  function render(wb) {
    mount.innerHTML = '';

    /* sheet tabs */
    const tabs = document.createElement('div');
    tabs.className = 'sheet-tabs';
    const body = document.createElement('div');
    body.className = 'sheet-scroll';
    mount.appendChild(tabs);
    mount.appendChild(body);

    const showSheet = name => {
      body.innerHTML = '';
      body.appendChild(buildTable(wb.Sheets[name]));
      tabs.querySelectorAll('button').forEach(b =>
        b.classList.toggle('active', b.dataset.sheet === name)
      );
    };

    wb.SheetNames.forEach((name, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = name;
      btn.dataset.sheet = name;
      btn.addEventListener('click', () => showSheet(name));
      tabs.appendChild(btn);
      if (i === 0) btn.classList.add('active');
    });
    if (wb.SheetNames.length <= 1) tabs.style.display = 'none';

    showSheet(wb.SheetNames[0]);
  }

  function buildTable(ws) {
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const table = document.createElement('table');
    table.className = 'sheet-table';

    /* find the first non-empty row to use as the header */
    let headerIdx = rows.findIndex(r => r.some(c => String(c).trim() !== ''));
    if (headerIdx < 0) headerIdx = 0;

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    (rows[headerIdx] || []).forEach(cell => {
      const th = document.createElement('th');
      th.textContent = cell;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r.some(c => String(c).trim() !== '')) continue; // skip blank rows
      const tr = document.createElement('tr');
      r.forEach(cell => {
        const td = document.createElement('td');
        const str = String(cell);
        td.textContent = str;
        if (str !== '' && !isNaN(parseFloat(str)) && isFinite(str)) {
          td.classList.add('cell-num');
          if (parseFloat(str) < 0) td.classList.add('cell-neg');
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }
});
