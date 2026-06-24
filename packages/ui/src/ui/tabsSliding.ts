/** transitions.dev tabs sliding — see 16-tabs-sliding.md */

export function findActiveTab(list: HTMLElement): HTMLElement | null {
  const tabs = list.querySelectorAll<HTMLElement>(".t-tab");
  for (const tab of tabs) {
    if (
      tab.getAttribute("aria-selected") === "true" ||
      tab.getAttribute("data-state") === "active"
    ) {
      return tab;
    }
  }
  if (tabs.length === 0) {
    return null;
  }
  return tabs[0];
}

export function moveTabsPill(
  pill: HTMLElement,
  tab: HTMLElement,
  animate: boolean,
): void {
  const left = tab.offsetLeft;
  const width = tab.offsetWidth;
  const top = tab.offsetTop;
  const height = tab.offsetHeight;

  if (!animate) {
    const previousTransition = pill.style.transition;
    pill.style.transition = "none";
    pill.style.transform = `translateX(${left}px)`;
    pill.style.width = `${width}px`;
    pill.style.top = `${top}px`;
    pill.style.height = `${height}px`;
    void pill.offsetWidth;
    pill.style.transition = previousTransition;
    return;
  }

  pill.style.transform = `translateX(${left}px)`;
  pill.style.width = `${width}px`;
  pill.style.top = `${top}px`;
  pill.style.height = `${height}px`;
}

export function syncTabsPill(
  list: HTMLElement,
  pill: HTMLElement,
  animate: boolean,
): void {
  const tab = findActiveTab(list);
  if (tab) {
    moveTabsPill(pill, tab, animate);
  }
}
