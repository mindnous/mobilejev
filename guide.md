build an react native app that can:
a. upload gguf model to this app
b. from this gguf model, can use
  b.1. /v1/model (/v1/chat/completions) to do basic llm task with text, or both image and text
  b.2. /v1/systemone to do typesafe JEV output (decision) with decision input output
  '''
curl -X POST http://192.168.0.85:12000/v1/systemone \
  -H "Content-Type: application/json" \
  -d '{
    "model": "/model/clef27b",
    "state": "Customer: I was charged twice and I am furious.",
    "questions": {
      "topic": {
        "type": "choice",
        "instructions": "What is the issue about?",
        "criteria": {
          "billing": "money problems",
          "bug": "broken product"
        }
      },
      "urgent": {
        "type": "noul",
        "instructions": "Escalate to a human now?"
      }
    }
  }'

output:
{"model":"/model/clef27b","answers":{"topic":{"type":"choice","choice":"billing","probabilities":{"billing":0.9746132642253339,"bug":0.02538673577466621},"confidence":0.9492265284506678},"urgent":{"type":"noul","noul":0.9815853833467716}},"usage":{"input_tokens":221,"output_tokens":0}}
'''

please make the UI as simple and easy to use as possible, and make the code as easy to read and understand as possible.
don't add unnecessary complication/logic, no need to add too much complicated logic if it fails, if it is then just throw error notification.