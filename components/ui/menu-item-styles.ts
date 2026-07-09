/**
 * Shared vertical rhythm for menu items (dropdown, select, command).
 * Matches navbar profile dropdown: comfortable tap target without oversized lists.
 */
export const MENU_ITEM_PADDING_CLASS = "px-2 py-1.5 min-h-9 h-auto";

/** Navbar / export menus: same padding + interaction colors */
export const DROPDOWN_NAV_ITEM_CLASS = `${MENU_ITEM_PADDING_CLASS} w-full justify-start text-gray-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 ease-in-out cursor-pointer focus:bg-gray-100 dark:focus:bg-white/10`;

export const DROPDOWN_NAV_CONTENT_CLASS =
  "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white shadow-lg dark:shadow-black/30 rounded-md";
