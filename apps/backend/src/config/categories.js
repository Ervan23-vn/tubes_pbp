/**
 * IT Electronics Auction Categories
 * Kategori barang lelang fokus bidang Informatika & Ilmu Komputer
 */

export const CATEGORIES = {
  hardware: {
    label: 'Hardware',
    icon: 'build',
    subcategories: {
      'hw-pc-component': { label: 'PC Components', icon: 'memory', examples: 'GPU, CPU, Motherboard, PSU, Cooler' },
      'hw-laptop-desktop': { label: 'Laptop & Desktop', icon: 'laptop_mac', examples: 'ThinkPad, MacBook, Gaming PC, Workstation' },
      'hw-networking': { label: 'Networking Equipment', icon: 'router', examples: 'Router, Switch, Access Point, Modem' },
      'hw-storage': { label: 'Storage & Memory', icon: 'storage', examples: 'SSD NVMe, HDD, RAM DDR5, NAS' },
      'hw-peripheral': { label: 'Peripherals & Accessories', icon: 'keyboard', examples: 'Keyboard, Mouse, Monitor, Webcam' },
      'hw-server': { label: 'Server & Enterprise', icon: 'dns', examples: 'Rack Server, UPS, KVM Switch, Blade' },
    }
  },
  software: {
    label: 'Software',
    icon: 'apps',
    subcategories: {
      'sw-os': { label: 'Operating System', icon: 'terminal', examples: 'Windows 11, macOS, Linux Enterprise' },
      'sw-devtools': { label: 'Development Tools', icon: 'code', examples: 'JetBrains, Visual Studio, GitHub Enterprise' },
      'sw-productivity': { label: 'Productivity Suite', icon: 'edit_document', examples: 'Microsoft 365, Adobe CC, Notion' },
      'sw-cloud': { label: 'Cloud & SaaS License', icon: 'cloud', examples: 'AWS Credits, Azure, Google Cloud' },
      'sw-game-media': { label: 'Game & Multimedia', icon: 'sports_esports', examples: 'Steam Games, FL Studio, DaVinci Resolve' },
      'sw-security': { label: 'Security & Utility', icon: 'shield', examples: 'Antivirus, Backup Tools, VMware License' },
    }
  }
};

export const ITEM_CONDITIONS = [
  { value: 'new', label: 'Baru / Sealed' },
  { value: 'like_new', label: 'Bekas - Like New' },
  { value: 'good', label: 'Bekas - Baik' },
  { value: 'refurbished', label: 'Refurbished' },
];

/**
 * Helper: Get all subcategories as flat array
 */
export function getAllSubcategories() {
  const result = [];
  for (const [mainKey, mainCat] of Object.entries(CATEGORIES)) {
    for (const [subKey, subCat] of Object.entries(mainCat.subcategories)) {
      result.push({
        main_category: mainKey,
        sub_category: subKey,
        main_label: mainCat.label,
        sub_label: subCat.label,
        icon: subCat.icon,
        examples: subCat.examples,
      });
    }
  }
  return result;
}

/**
 * Helper: Get subcategory label from code
 */
export function getSubcategoryLabel(subCode) {
  for (const mainCat of Object.values(CATEGORIES)) {
    if (mainCat.subcategories[subCode]) {
      return mainCat.subcategories[subCode].label;
    }
  }
  return subCode;
}
