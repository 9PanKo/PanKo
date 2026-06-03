/** PanKo — Home shell sections (?section= query). */
export const HOME_SECTIONS = ['home', 'profile', 'recipes', 'blog', 'chefseye'];

export function getHomeSectionFromSearch(search) {
  const section = new URLSearchParams(search).get('section');
  return HOME_SECTIONS.includes(section) ? section : 'home';
}

export function homeSectionSearch(section) {
  if (!HOME_SECTIONS.includes(section) || section === 'home') return '';
  return `?section=${section}`;
}
