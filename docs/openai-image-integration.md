# Integração com OpenAI para geração de imagens
- **Stack**: Node.js + Express em CommonJS.
- **Serviço central**: `services/imageService.js`.
- **Modelo de domínio**: `models/image.js`.
- **Rotas expostas**: `routes/imageRoutes.js`.

## Visão geral
- A aplicação oferece um conjunto de endpoints para gerar imagens via OpenAI, salvar arquivos localmente e fazer proxy de download.
- O serviço encapsula a SDK oficial (`openai`) para reutilizar o cliente com a chave presente em `OPENAI_API_KEY`.
- A resposta preferencial é uma URL hosted pela OpenAI (`response_format: "url"`), reduzindo tempo de resposta em comparação com payloads base64.

## Configuração necessária
- Variável de ambiente `OPENAI_API_KEY` definida no `.env`.
- Dependência `openai` instalada (já presente em `package.json`).
- Pasta `uploads/` criada dinamicamente quando salvamentos em arquivo são solicitados.

## Fluxo de requisição
1. Cliente chama uma das rotas (por exemplo, `POST /images/generate-url`).
2. O controller (`controllers/imageController.js`) valida o payload, aplica defaults de modelo (`dall-e-3`) e encaminha para o serviço.
3. `ImageService.generateImage` executa a chamada à OpenAI com timeout de 30 s (`Promise.race`).
4. A resposta é traduzida para uma instância de `Image`, centralizando estrutura e serialização.
5. Em caso de `saveToFile`, o serviço grava o arquivo em `uploads/` e devolve metadados.
6. Controllers retornam sempre `image.toAPIResponse()`, mantendo o contrato consistente.

## Decisões principais e motivação
- **CommonJS e classe de serviço**: o código original em ESM foi convertido para CommonJS para alinhar com o restante do backend. A classe `ImageService` permite compartilhar o mesmo cliente configurado com `process.env.OPENAI_API_KEY`.
- **`response_format: "url"`**: optamos por abandonar `b64_json` porque as respostas em base64 chegavam lentas e pesadas. Usar URLs hospedadas pela OpenAI acelera a entrega; quando necessário, utilizamos `downloadImageFromUrl` para atuar como proxy e driblar CORS/expiração.
- **Timeout explícito**: adicionamos `Promise.race` com 30 s para evitar requisições penduradas quando a OpenAI demora.
- **Fallback mockado**: em erros de timeout ou retorno da API, devolvemos uma imagem placeholder (`https://via.placeholder.com/...`) para preservar a UX do front.
- **Modelo `Image`**: centraliza transformação da resposta (sucesso e erro), garantindo consistência entre endpoints e facilitando ajustes em um único lugar.
- **Métodos especializados**: além de `generateImage`, existem `generateAndSaveImage`, `generateImageBase64`, `generateImageWithUrl` e `downloadImageFromUrl`, permitindo atender casos de uso distintos sem duplicar lógica.

## Endpoints suportados
- `POST /images/generate`: gera imagem e, opcionalmente, salva arquivo (`saveToFile`).
- `POST /images/generate-file`: sempre salva o arquivo e retorna os metadados.
- `POST /images/generate-base64`: mantém a opção de consumir base64 quando explicitamente solicitado.
- `POST /images/generate-url`: devolve a URL pública gerada pela OpenAI.
- `POST /images/download-proxy`: faz proxy do download usando a URL retornada pela OpenAI.

## Considerações sobre URLs temporárias
- As URLs devolvidas pela OpenAI expiram; por isso fornecemos o proxy (`downloadImageFromUrl`) para servir o arquivo através do backend.
- O proxy define headers (`Content-Type`, `Content-Length`, `Content-Disposition`) e retorna o `Buffer` ao cliente.
- Caso a URL remota falhe, o serviço devolve mensagem clara (`Erro ao baixar imagem: ...`).

## Possíveis extensões
- Persistir metadados de geração no banco usando o modelo `Image`.
- Adicionar fila/background job para requisições com prompts pesados.
- Implementar limpeza periódica da pasta `uploads/`.
- Enriquecer logs com IDs de correlação para rastrear requisições end-to-end.
