export const generateSceneBackground = (subject, topic, prompt) => {
  const combinedStr = `${subject} ${topic} ${prompt}`.toLowerCase();
  
  if (combinedStr.includes('space') || combinedStr.includes('planet') || combinedStr.includes('orbit')) {
    return 'url("/assets/backgrounds/space.png")';
  }
  if (combinedStr.includes('water') || combinedStr.includes('rain') || combinedStr.includes('river')) {
    return 'url("/assets/backgrounds/water_cycle.png")';
  }
  if (combinedStr.includes('lab') || combinedStr.includes('chemistry') || combinedStr.includes('reaction')) {
    return 'url("/assets/backgrounds/lab.png")';
  }
  if (combinedStr.includes('cell') || combinedStr.includes('biology')) {
    return 'url("/assets/backgrounds/microscope.png")';
  }
  if (combinedStr.includes('circuit') || combinedStr.includes('electric')) {
    return 'url("/assets/backgrounds/tech_lab.png")';
  }
  if (combinedStr.includes('projectile') || combinedStr.includes('truck')) {
    return 'url("/assets/backgrounds/outdoor_grass.png")';
  }
  
  // Default fallbacks based on subject
  const subj = (subject || "").toLowerCase();
  if (subj === 'physics') return 'url("/assets/backgrounds/physics_grid.png")';
  if (subj === 'math' || subj === 'mathematics') return 'url("/assets/backgrounds/math_grid.png")';
  
  return '#050816'; // Fallback solid dark futuristic color
};
