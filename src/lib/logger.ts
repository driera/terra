export interface Logger {
  info: (message: string) => void
}

export const consoleLogger: Logger = {
  info: (message) => {
    if (import.meta.env.DEV) console.info(message)
  },
}

export default consoleLogger
