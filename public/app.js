document.getElementById('year').textContent = new Date().getFullYear();

async function loadEvents(){
  const list = document.getElementById('event-list');
  list.innerHTML = '<div class="card">Carregando eventos...</div>';
  try{
    const res = await fetch('/eventos');
    if(!res.ok) throw new Error('Nenhuma resposta da API');
    const data = await res.json();

    // A rota /eventos pode devolver diferentes formatos; adaptamos estrategicamente
    const eventos = Array.isArray(data) ? data : (data.eventos || data.rows || []);

    if(eventos.length === 0){
      list.innerHTML = '<div class="card">Nenhum evento encontrado.</div>';
      return;
    }

    list.innerHTML = eventos.map(ev => {
      const titulo = ev.titulo || ev.title || 'Evento sem título';
      const descricao = ev.descricao || ev.description || '';
      const dataEvento = ev.data_evento || ev.date || '';
      return `\
        <div class="card">\
          <h4>${escapeHtml(titulo)}</h4>\
          <div class="meta">${escapeHtml(formatDate(dataEvento))}</div>\
          <p>${escapeHtml(descricao).slice(0,160)}${descricao.length>160? '...':''}</p>\
        </div>`;
    }).join('');

  }catch(err){
    list.innerHTML = `<div class="card">Erro ao carregar eventos: ${escapeHtml(err.message)}</div>`;
  }
}

function formatDate(d){
  if(!d) return '';
  const dt = new Date(d);
  if(isNaN(dt)) return d;
  return dt.toLocaleString();
}

function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

loadEvents();
