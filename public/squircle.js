class SquirclePainter {
  static get inputProperties() {
    return ['--squircle-radius', '--squircle-smooth', '--squircle-outline', '--squircle-color'];
  }
  
  paint(ctx, geom, properties) {
    const w = geom.width;
    const h = geom.height;
    
    let r = parseFloat(properties.get('--squircle-radius')) || 0;
    let smooth = parseFloat(properties.get('--squircle-smooth'));
    if (isNaN(smooth)) smooth = 1;
    let outline = parseFloat(properties.get('--squircle-outline')) || 0;
    let color = properties.get('--squircle-color').toString().trim() || '#000';
    
    // Ensure radius doesn't exceed half the shortest side
    r = Math.min(r, w/2, h/2);
    
    ctx.beginPath();
    
    if (r === 0 || smooth === 0) {
      ctx.rect(0, 0, w, h);
    } else {
      // Standard circular curve kappa is 0.55228
      // We push it towards 1.0 for a "fatter" superellipse/squircle effect.
      // Apple's continuous corner looks like a higher kappa bezier.
      const k = 0.552284749831;
      const kappa = k + (0.44 * smooth); 
      
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.bezierCurveTo(w - r * (1 - kappa), 0, w, r * (1 - kappa), w, r);
      
      ctx.lineTo(w, h - r);
      ctx.bezierCurveTo(w, h - r * (1 - kappa), w - r * (1 - kappa), h, w - r, h);
      
      ctx.lineTo(r, h);
      ctx.bezierCurveTo(r * (1 - kappa), h, 0, h - r * (1 - kappa), 0, h - r);
      
      ctx.lineTo(0, r);
      ctx.bezierCurveTo(0, r * (1 - kappa), r * (1 - kappa), 0, r, 0);
    }
    
    ctx.closePath();
    
    if (outline > 0) {
      ctx.lineWidth = outline * 2;
      ctx.strokeStyle = color;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

if (typeof registerPaint !== 'undefined') {
  registerPaint('squircle', SquirclePainter);
}
