# Mock chat module for emergentintegrations

class LlmChat:
    def __init__(self, api_key=None, session_id=None, system_message=None):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
    
    def with_model(self, provider, model):
        self.provider = provider
        self.model = model
        return self
    
    async def send_message(self, message):
        # Mock response
        return "This is a mock AI insight response. The actual emergentintegrations package is required for real functionality."

class UserMessage:
    def __init__(self, text):
        self.text = text