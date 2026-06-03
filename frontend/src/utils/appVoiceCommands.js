/** PanKo — Section navigation voice command table. */
export function getAppNavigationVoiceCommands(goToSection) {
  return [
    { word: "chef's eye", action: () => goToSection('chefseye') },
    { word: 'chefs eye', action: () => goToSection('chefseye') },
    { word: 'chef eye', action: () => goToSection('chefseye') },
    { word: 'recipe blog', action: () => goToSection('blog') },
    { word: 'profile', action: () => goToSection('profile') },
    { word: 'recipes', action: () => goToSection('recipes') },
    { word: 'library', action: () => goToSection('recipes') },
    { word: 'recipe', action: () => goToSection('recipes') },
    { word: 'home', action: () => goToSection('home') },
    { word: 'chef', action: () => goToSection('chefseye') },
    { word: 'blog', action: () => goToSection('blog') },
  ];
}
