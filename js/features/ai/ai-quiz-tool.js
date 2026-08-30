// ---------- Quiz (interactive, click an option to check it) ----------
async function runAiQuiz(){
  const text = g('ai-quiz-input').value.trim();
  const outWrap = g('ai-quiz-output');
  if (!text) { outWrap.innerHTML = ''; outWrap.textContent = 'Please paste some material first.'; return; }
  const btn = event && event.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Working…'; }
  outWrap.innerHTML = '<div class="ai-tool-output">Generating quiz…</div>';
  try {
    const count = +g('ai-quiz-count').value;
    const { questions } = await aiPost('/api/quiz', { text, count });
    outWrap.innerHTML = '';
    (questions || []).forEach((q, qi) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'ai-quiz-q';
      const qText = document.createElement('div');
      qText.style.fontWeight = '600'; qText.style.fontSize = '12.5px';
      qText.textContent = (qi + 1) + '. ' + q.question;
      qDiv.appendChild(qText);
      (q.options || []).forEach((opt, oi) => {
        const optBtn = document.createElement('button');
        optBtn.type = 'button'; optBtn.className = 'ai-quiz-opt'; optBtn.textContent = opt;
        optBtn.onclick = () => {
          qDiv.querySelectorAll('.ai-quiz-opt').forEach(b => b.disabled = true);
          if (oi === q.answerIndex) optBtn.classList.add('correct');
          else {
            optBtn.classList.add('wrong');
            const correctBtn = qDiv.querySelectorAll('.ai-quiz-opt')[q.answerIndex];
            if (correctBtn) correctBtn.classList.add('correct');
          }
        };
        qDiv.appendChild(optBtn);
      });
      outWrap.appendChild(qDiv);
    });
    aiTypeset(outWrap);
  } catch (err) {
    console.error('Quiz error:', err);
    outWrap.innerHTML = '<div class="ai-tool-output">⚠️ ' + err.message + '</div>';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Quiz'; }
  }
}

