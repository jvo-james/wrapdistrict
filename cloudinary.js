(() => {
  const configured = () => {
    const c = window.WD_CONFIG?.cloudinary || {};
    return c.cloudName && c.uploadPreset && !String(c.cloudName).startsWith('YOUR_') && !String(c.uploadPreset).startsWith('YOUR_');
  };

  async function upload(file, folder = '') {
    if (!(file instanceof File) || !file.size) throw new Error('Choose an image first.');
    if (!configured()) throw new Error('Add your Cloudinary cloud name and unsigned upload preset in config.js.');
    if (!/^image\/(jpeg|png|webp|gif|avif)$/i.test(file.type)) throw new Error('Please upload a JPG, PNG, WEBP, GIF or AVIF image.');
    if (file.size > 8 * 1024 * 1024) throw new Error('Please choose an image smaller than 8 MB.');

    const { cloudName, uploadPreset, folder: root = 'wrapdistrict' } = WD_CONFIG.cloudinary;
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', uploadPreset);
    body.append('folder', [root, folder].filter(Boolean).join('/'));

    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: 'POST', body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.error?.message || 'Cloudinary upload failed.');
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  }

  window.WD_CLOUDINARY = { upload, configured };
})();
