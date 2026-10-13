export type DealershipLayout = {
  leftBrand: string;
  rightBrand: string;
  waitingRoom: boolean;
  workshopSpacing?: number;
};
export const portoLayout: DealershipLayout = {
  leftBrand: "Jaguar",
  rightBrand: "Land Rover",
  waitingRoom: true,
  workshopSpacing: 5,
};
export function layoutFor(value?: DealershipLayout): DealershipLayout {
  return { ...portoLayout, ...value };
}
