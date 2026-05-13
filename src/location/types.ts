export type Coordinates = [number, number]

export type LocationResolver = () => Promise<Coordinates>
