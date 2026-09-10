# PDF Studio V1.4.1

Suíte profissional de visualização, composição e edição visual de PDF feita em HTML, CSS e JavaScript. Os documentos selecionados são processados no navegador; a aplicação não possui backend próprio.

## Editor visual — introduzido na 1.3.0

O preview da página também funciona como área de edição por objetos, mantendo a organização do documento no painel esquerdo.

### Texto
- Ferramenta **Texto** no topo do preview.
- Clique na página para criar uma caixa de texto.
- Duplo clique no texto para editar o conteúdo diretamente.
- Mover por arrastar e soltar.
- Redimensionar pela alça inferior.
- Girar pela alça superior ou informar o ângulo.
- Helvetica, Times e Courier.
- Tamanho de 6 a 144 pt.
- Negrito e itálico.
- Alinhamento à esquerda, centro ou direita.
- Cor do texto.
- Opacidade.
- Trazer para frente / enviar para trás.
- Duplicar e excluir.

### Imagem sobre a página
- Ferramenta **Imagem** aceita PNG, JPEG e WebP.
- A imagem é inserida como objeto sobre a página atual.
- Mover, redimensionar e girar livremente.
- Redimensionamento mantém a proporção por padrão; segure Shift para ajuste livre.
- Opacidade.
- Ordem de camadas.
- Duplicar e excluir.

### Integração com o documento
- Objetos aparecem no preview, thumbnails e modo Organizar.
- Objetos participam do histórico de desfazer/refazer.
- Rotacionar a página também reposiciona os elementos adicionados.
- Impressão inclui os elementos.
- Extração de páginas inclui os elementos.
- Exportação comprimida inclui os elementos na resolução selecionada.
- Na exportação sem compressão, páginas sem edição continuam sendo preservadas vetorialmente sempre que possível. Páginas com objetos adicionados são compostas a 300 DPI para garantir fidelidade visual entre preview, impressão e PDF final.

## Visualizador PDF
- Preview grande no painel direito.
- Navegação página anterior/próxima e indicador `página / total`.
- Zoom `-` e `+`.
- Visualização em 100%.
- Ajustar à largura.
- Ajustar página à área disponível.
- Tela cheia.
- Impressão da composição atual usando o visualizador/mecanismo de impressão do navegador.

## Composição de páginas
- Thumbnails no painel esquerdo.
- Reordenação por arrastar e soltar.
- Botão `+` antes da primeira página, entre todas as páginas e depois da última.
- O `+` permite inserir página A4 em branco, PDF, PNG, JPEG ou WebP.
- Arquivos podem ser soltos diretamente em um `+` para inserção exata naquela posição.
- Arquivos também podem ser soltos sobre uma página para inserção antes/depois conforme a posição do cursor.
- Área superior de carregamento com inserção antes ou depois da página atual.

## Operações de página
- Rotação individual à esquerda/direita.
- Rotação de todas as páginas à esquerda/direita.
- Exclusão.
- Duplicação.
- Menu de contexto com botão direito.
- Exibição aproximada das dimensões físicas da página em milímetros.

## Seleção múltipla
- `Ctrl` / `⌘` para selecionar páginas avulsas.
- `Shift` para selecionar intervalos.
- Rotacionar, duplicar, excluir ou extrair a seleção.
- Arrastar uma seleção para mover as páginas como um bloco.

## Organizar páginas
O botão **Organizar** abre uma visão em grade para documentos maiores, com seleção múltipla, drag-and-drop, inserção, duplicação, extração e exclusão.

## Documento
- **Novo documento > Novo em branco**.
- **Novo documento > Carregar de arquivo**.
- Nome do documento editável no topo.
- Indicador de alterações ainda não exportadas.
- Aviso ao substituir/fechar um documento com alterações pendentes.
- Propriedades com páginas, fontes carregadas, tamanho, orientações e quantidade de elementos adicionados.
- Desfazer/refazer.

## Exportação
Saída sempre em PDF.

### Sem compressão
- Preserva páginas PDF vetoriais sempre que possível.
- Mantém imagens originais nas páginas sem edição.
- Páginas que receberam texto/imagem pelo editor são compostas com fidelidade visual a 300 DPI.

### Com compressão
- Cor, tons de cinza ou monocromático.
- 100 a 400 DPI.
- Controle de qualidade JPEG.
- Dithering opcional no monocromático.
- Estimativa aproximada do tamanho de saída.

## Atalhos
- `Ctrl/⌘ + Z`: desfazer.
- `Ctrl/⌘ + Y`: refazer.
- `Ctrl/⌘ + P`: imprimir.
- `Ctrl/⌘ + S`: exportar.
- `T`: ferramenta Texto.
- `V`: ferramenta Selecionar.
- `Delete`: excluir o objeto selecionado; sem objeto, exclui a(s) página(s) selecionada(s).
- Setas: com objeto selecionado, move 1 pt; com Shift, move 10 pt.
- `←` / `Page Up` e `→` / `Page Down`: navegação quando não há objeto selecionado.
- `Esc`: sair da ferramenta Texto, limpar seleção de objeto ou fechar menus/modais.

## Execução

Abra `index.html` em um navegador moderno ou publique a pasta em um servidor HTTP/HTTPS estático.

Esta compilação inclui localmente, no diretório `libs/`:
- PDF.js 3.11.174 (`pdf.min.js` + `pdf.worker.min.js`) — Apache-2.0
- pdf-lib 1.17.1 (`pdf-lib.min.js`) — MIT

Não há dependência de CDN para essas bibliotecas. O processamento do documento ocorre localmente no navegador.

## Estrutura do pacote
O arquivo compactado e o diretório interno seguem o mesmo padrão:

`PDF_Studio.V1.4.1.zip`

`PDF_Studio.V1.4.1/`

Arquivos principais:
- `index.html` — interface.
- `styles.css` — layout, visualizador e camada de edição.
- `app.js` — visualização, composição, edição por objetos, seleção, impressão e exportação.

## Versão 1.4.0
Correção da v1.3.0 focada na navegação do visualizador:
- restaura a barra de rolagem vertical do painel de thumbnails;
- habilita rolagem horizontal e vertical no preview sempre que o zoom excede a área disponível;
- corrige a centralização que podia deixar partes ampliadas da página inacessíveis;
- permite deslocar o preview ampliado segurando **Espaço + arrastar** ou usando o **botão do meio do mouse**;
- permite deslocamento horizontal com **Shift + roda do mouse**;
- adota o padrão definitivo de pacote e diretório `PDF_Studio.V<versão>`.


## Novidades da V1.4.0

- **Editar texto existente:** em páginas PDF com texto selecionável, use **Editar texto** (atalho `E`) e clique em um bloco detectado. O bloco é convertido em uma edição visual substitutiva, preservada na impressão e na exportação. PDFs digitalizados/imagens não possuem texto detectável nesta versão e exigiriam OCR.
- **Mover página para...:** botão `⇅` no thumbnail, opção no menu de contexto e clique no contador de páginas do preview. Informe a posição final (por exemplo, `1`) e confirme em **OK** ou **Cancelar**.
- A movimentação por posição participa de Desfazer/Refazer e mantém a página movida selecionada.

### Observação sobre edição de texto PDF

PDF não é um formato de fluxo de texto como DOCX. Nesta versão a ferramenta detecta os blocos de texto do PDF com PDF.js e cria uma substituição visual editável sobre o conteúdo original. Isso funciona bem para correções pontuais e documentos com fundo uniforme. Fontes incorporadas, textos rotacionados ou fundos complexos podem exigir ajuste manual de fonte, tamanho, cor ou posição.


## Versão 1.4.1

- Projeto identificado como open-source sob **GPL-3.0-or-later**.
- Autor: **Roberto Fettuccia**.
- Licença GPL completa em `LICENSE`.
- Dependências e respectivas licenças exibidas em **Sobre** e documentadas em `THIRD_PARTY_NOTICES.md`.
- PDF.js e pdf-lib carregados localmente a partir de `libs/`, sem CDN.
- Navegação por roda/trackpad no preview: dentro de uma página ampliada a rolagem continua normal; ao chegar ao final, rolar para baixo avança uma página; ao chegar ao topo, rolar para cima volta uma página.
- A troca por gesto possui limiar e bloqueio curto para evitar saltar várias páginas acidentalmente.
- Ao avançar por scroll a próxima página começa no topo; ao voltar, a página anterior é posicionada no final, simulando leitura contínua.

## Licença

Copyright © 2026 Roberto Fettuccia.

PDF Studio é software livre: você pode redistribuí-lo e/ou modificá-lo sob os termos da GNU General Public License, versão 3 ou qualquer versão posterior, conforme o arquivo `LICENSE`.
