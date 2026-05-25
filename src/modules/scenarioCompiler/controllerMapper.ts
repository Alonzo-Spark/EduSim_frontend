import { useInspectorStore } from '@/store/inspectorStore'

export async function createControllers(
  controllers: any[]
) {
  const setControllers = useInspectorStore.getState().setControllers
  setControllers(controllers)
}
