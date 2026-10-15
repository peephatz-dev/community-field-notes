"""PDF from inspected high-resolution slide renders. PPTX remains editable.
The bundled Artifact PDF exporter is missing #standard-fonts/Helvetica, and
headless LibreOffice lacks Thai fonts in its isolated environment. Rendering
images preserves the approved Thai typography without silent font substitution.
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
root = Path(__file__).resolve().parent.parent
pdf = root / 'SalaHum_PowerGuard_Pitch_10Slides_16x9.pdf'
c = canvas.Canvas(str(pdf), pagesize=(960, 540), pageCompression=1)
c.setTitle('SALA HUM POWERGUARD – Pitch 10 Slides')
c.setAuthor('SALA HUM POWERGUARD project team')
for i in range(1, 11):
    image = root / 'slides' / f'slide-{i:02}.png'
    c.drawImage(ImageReader(str(image)), 0, 0, width=960, height=540)
    if i == 7:
        c.linkURL('https://peephatz-dev.github.io/community-field-notes/energy-platform/', (42, 45, 650, 68), relative=0, thickness=0)
    c.showPage()
c.save()
print(pdf)
