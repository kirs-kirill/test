document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    const images = document.querySelectorAll(".image-reference img");
    console.log('Found ' + images.length + ' images');
    for (const image of images) {
      console.log('Processing image: ' + image.src);
      try {
        new Luminous(image.parentElement);
        console.log('Luminous initialized for image');
      } catch (error) {
        console.error('Error initializing Luminous:', error);
      }
    }
  });