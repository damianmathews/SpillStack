import * as React from 'react';

  function useHandleStreamResponse({
  onChunk,
  onFinish
}) {
  const handleStreamResponse = React.useCallback(
    async (response) => {
      if (!response.body) {
        onFinish("");
        return;
      }

      try {
        const reader = response.body.getReader();
        if (!reader) {
          onFinish("");
          return;
        }

        const decoder = new TextDecoder();
        let content = "";

        while (true) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              onFinish(content);
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            content += chunk;
            onChunk(content);
          } catch (readError) {
            console.error("Stream read error:", readError);
            onFinish(content);
            break;
          }
        }
      } catch (error) {
        console.error("Stream response error:", error);
        onFinish("");
      }
    },
    [onChunk, onFinish]
  );
  const handleStreamResponseRef = React.useRef(handleStreamResponse);
  React.useEffect(() => {
    handleStreamResponseRef.current = handleStreamResponse;
  }, [handleStreamResponse]);
  return React.useCallback((response) => handleStreamResponseRef.current(response), []); 
}

  export default useHandleStreamResponse;