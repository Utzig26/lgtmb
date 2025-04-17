export default {
  async fetch(request: Request<unknown, IncomingRequestCfProperties>, env: Env): Promise<Response> {
    try {
      const objects = await env.LGTMB_BUCKET.list();
      const totalImages = objects.objects.length;

      const randomIndex = Math.floor(Math.random() * totalImages) + 1;
    
      const imageKey = `${randomIndex}.webp`;
      
      const image = await env.LGTMB_BUCKET.get(imageKey);
      
      if (!image) {
        return new Response(`Image ${imageKey} not found`, { status: 404 });
      }

      const headers = new Headers();
      headers.set('Content-Type', 'image/webp');
      headers.set('Cache-Control', 'public, max-age=31536000');
      
      return new Response(image.body as unknown as ReadableStream, {
        status: 200,
        headers
      });
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
} satisfies ExportedHandler<Env>;