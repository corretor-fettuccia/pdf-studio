# Publicação no GitHub Pages

Destino previsto: `https://corretor-fettuccia.github.io/pdf-studio/`

Publique **o conteúdo desta pasta na raiz do repositório `pdf-studio`**. O projeto usa caminhos relativos (`./`), portanto `manifest.webmanifest`, Service Worker, ícones e recursos continuam funcionando dentro do subdiretório `/pdf-studio/`.

## Instalação pelo navegador

No Chrome/Edge compatível, o botão **Instalar no navegador** usa `beforeinstallprompt` quando o navegador disponibiliza o evento. Depois de instalado, o PDF Studio abre em janela própria.

## Offline

A primeira execução deve ocorrer online para que o Service Worker armazene a aplicação e as bibliotecas PDF.js/pdf-lib usadas pelo projeto. Depois desse primeiro cache, o Studio pode reabrir sem conexão.

## Abrir arquivos do sistema

O manifesto registra PDF, PNG, JPEG e WEBP em `file_handlers`. Em navegadores/sistemas compatíveis, o PDF Studio instalado pode aparecer em **Abrir com**. O app recebe os arquivos pela `launchQueue`.
