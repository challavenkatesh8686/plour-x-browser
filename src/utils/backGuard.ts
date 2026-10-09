/** Count of open form sheets, so the hardware back handler can leave the press to the sheet (which closes itself). */
let openSheets = 0
export const isFormSheetOpen = () => openSheets > 0
export const setFormSheetOpen = (open: boolean) => {
  openSheets = Math.max(0, openSheets + (open ? 1 : -1))
}
