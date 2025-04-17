import { R2Bucket } from '@cloudflare/workers-types';

interface Env {
  LGTMB_BUCKET: R2Bucket;
}

interface Metadata {
  totalImages: number;
}

async function getRandomImage(bucket: R2Bucket, totalImages: number): Promise<Response> {
  const randomIndex = Math.floor(Math.random() * totalImages) + 1;
  const image = await bucket.get(`${randomIndex}.webp`);

  if (!image) {
    if (totalImages > 1)
      return getRandomImage(bucket, totalImages);
    return new Response('No images available', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'image/webp');
  headers.set('Cache-Control', 'public, max-age=2628000');

  return new Response(image.body, { status: 200, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const metadataObject = await env.LGTMB_BUCKET.get('metadata.json');
      
      if (!metadataObject) return new Response('Metadata not found', { status: 404 });

      const metadata: Metadata = await metadataObject.json();
      const totalImages = metadata.totalImages;

      if (totalImages <= 0) return new Response('No images available', { status: 404 });

      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/').filter(segment => segment);
      const requestedId = pathSegments[0];

      if (requestedId) {
        const image = await env.LGTMB_BUCKET.get(`${requestedId}.webp`);

        if (image) {
          const headers = new Headers();
          headers.set('Content-Type', 'image/webp');
          headers.set('Cache-Control', 'public, max-age=2628000'); 
          return new Response(image.body, { status: 200, headers });
        }
      }
      return getRandomImage(env.LGTMB_BUCKET, totalImages);
    } catch (error) {
      console.error(error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
} satisfies ExportedHandler<Env>;