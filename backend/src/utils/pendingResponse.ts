interface PendingResponse{
  resolve: (response : string) => void,
  reject : (error : string) => void
}

const pending = new Map<string, PendingResponse>();

export const waitForResponse = async (correlationId: string) => {
  return new Promise((resolve, reject) => {
    pending.set(correlationId, {
      resolve,
      reject
    })
  })
}

export const resolveResponse = async (correlationId: string, response: string) => {
  const pendingResponse = pending.get(correlationId);
  if (!pendingResponse) return;

  pending.delete(correlationId);
  pendingResponse.resolve(response);
}
