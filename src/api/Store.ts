export type Subscriber<DataType> = (
  data: DataType,
  changedKeys: (keyof DataType)[]
) => void

export class Store<DataType> {
  private data: DataType
  private subscribers: { [key: number]: Subscriber<DataType> } = {}
  private subscribersOnce: Subscriber<DataType>[] = []
  private resetData: () => DataType
  private nextIndex = 0

  constructor(resetData: () => DataType) {
    this.resetData = resetData
    this.data = resetData()
  }

  get(): DataType {
    return this.data
  }

  set(partial: Partial<DataType>): void {
    const entries = Object.entries(partial) as [
      keyof DataType,
      DataType[keyof DataType]
    ][]
    const changedKeys = entries
      .filter(([key, value]) => !Object.is(this.data[key], value))
      .map(([key]) => key)

    if (changedKeys.length === 0) return

    this.data = { ...this.data, ...partial } as DataType

    Object.values(this.subscribers).forEach((subscriber) => {
      subscriber(this.data, changedKeys)
    })

    const once = this.subscribersOnce
    this.subscribersOnce = []
    once.forEach((subscriber) => subscriber(this.data, changedKeys))
  }

  subscribe(callback: Subscriber<DataType>): () => void {
    const index = this.nextIndex++
    this.subscribers[index] = callback
    return () => {
      delete this.subscribers[index]
    }
  }

  subscribeOnce(callback: Subscriber<DataType>): void {
    this.subscribersOnce.push(callback)
  }

  reset(): void {
    this.data = this.resetData()
    this.subscribers = {}
    this.subscribersOnce = []
    this.nextIndex = 0
  }
}
