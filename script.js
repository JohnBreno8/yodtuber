const { jsPDF } = window.jspdf;
const editor = document.getElementById('editor');
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const highlightBtn = document.getElementById('highlightBtn');
const colorBtn = document.getElementById('colorBtn');
const fontSize = document.getElementById('fontSize');
const fontFamily = document.getElementById('fontFamily');
const linkBtn = document.getElementById('linkBtn');
const tableBtn = document.getElementById('tableBtn');
const textboxBtn = document.getElementById('textboxBtn');
const imageBtn = document.getElementById('imageBtn');
const pageSize = document.getElementById('pageSize');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const imageInput = document.getElementById('imageInput');

// Funções de formatação
boldBtn.onclick = () => document.execCommand('bold', false, null);
italicBtn.onclick = () => document.execCommand('italic', false, null);
highlightBtn.onclick = () => document.execCommand('backColor', false, 'yellow');
colorBtn.onclick = () => {
   const color = prompt('Digite uma cor (ex: red, #ff0000):');
   if (color) document.execCommand('foreColor', false, color);
};

fontSize.onchange = () => document.execCommand('fontSize', false, fontSize.value / 4);
fontFamily.onchange = () => document.execCommand('fontName', false, fontFamily.value);

linkBtn.onclick = () => {
   const url = prompt('Digite o URL:');
   if (url) document.execCommand('createLink', false, url);
};

tableBtn.onclick = () => {
   const rows = prompt('Número de linhas:');
   const cols = prompt('Número de colunas:');
   if (rows && cols) {
      const table = document.createElement('table');
      for (let i = 0; i < rows; i++) {
         const tr = document.createElement('tr');
         for (let j = 0; j < cols; j++) {
            const td = document.createElement('td');
            td.contentEditable = true;
            td.textContent = ' ';
            tr.appendChild(td);
         }
         table.appendChild(tr);
      }
      editor.appendChild(table);
   }
};

textboxBtn.onclick = () => {
   const textbox = document.createElement('div');
   textbox.className = 'textbox';
   textbox.contentEditable = true;
   textbox.textContent = 'Caixa de texto';
   editor.appendChild(textbox);
};

imageBtn.onclick = () => imageInput.click();
imageInput.onchange = (e) => {
   const file = e.target.files[0];
   if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
         const img = document.createElement('img');
         img.src = event.target.result;
         img.style.maxWidth = '200px';
         editor.appendChild(img);
      };
      reader.readAsDataURL(file);
   }
};

// Função para gerar PDF
function generatePDF(action) {
   const doc = new jsPDF({ format: pageSize.value });
   let y = 10;
   
   const processNode = (node) => {
      if (node.nodeType === 3) { // Texto simples
         const text = node.textContent.trim();
         if (text) {
            const style = window.getComputedStyle(node.parentElement);
            doc.setFont(style.fontFamily.replace(/['"]/g, ''));
            doc.setFontSize(parseInt(style.fontSize));
            if (style.fontWeight === 'bold') doc.setFont(undefined, 'bold');
            if (style.fontStyle === 'italic') doc.setFont(undefined, 'italic');
            if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') doc.setFillColor(style.backgroundColor);
            if (style.color) doc.setTextColor(style.color);
            doc.text(text, 10, y);
            y += 10;
         }
      } else if (node.nodeName === 'IMG') {
         const canvas = document.createElement('canvas');
         canvas.width = node.width;
         canvas.height = node.height;
         canvas.getContext('2d').drawImage(node, 0, 0);
         const imgData = canvas.toDataURL('image/png');
         doc.addImage(imgData, 'PNG', 10, y, 50, 50);
         y += 60;
      } else if (node.nodeName === 'TABLE') {
         const rows = Array.from(node.rows).map(row =>
            Array.from(row.cells).map(cell => cell.textContent)
         );
         doc.autoTable({ startY: y, body: rows });
         y = doc.lastAutoTable.finalY + 10;
      } else if (node.className === 'textbox') {
         doc.rect(10, y - 5, 100, 20);
         doc.text(node.textContent, 12, y);
         y += 25;
      } else if (node.nodeName === 'A') {
         doc.setTextColor(0, 0, 255); // Azul para links
         doc.textWithLink(node.textContent, 10, y, { url: node.href });
         y += 10;
      }
      if (node.childNodes) node.childNodes.forEach(processNode);
   };
   
   editor.childNodes.forEach(processNode);
   
   if (action === 'download') {
      doc.save('documento.pdf');
   } else if (action === 'share') {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], 'documento.pdf', { type: 'application/pdf' });
      if (navigator.share) {
         navigator.share({
            files: [file],
            title: 'Meu PDF',
            text: 'Confira meu documento PDF!',
         }).catch(console.error);
      } else {
         alert('Compartilhamento não suportado neste navegador.');
      }
   }
}

downloadBtn.onclick = () => generatePDF('download');
shareBtn.onclick = () => generatePDF('share');

editor.focus();
