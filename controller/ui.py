import streamlit as st
import asyncio
import uuid
from router import get_target_agent
import sys
import os

# Add parent dir to path so we can import common
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from common.http_client import call_agent
from common.registry import get_registry
from common.config_loader import load_config

st.set_page_config(page_title="Multi-Agent AI Platform", layout="wide")
st.title("Multi-Agent AI Platform")

mode = st.sidebar.selectbox("Mode", ["Auto", "Code", "Research"])

registry = get_registry()
st.sidebar.subheader("Active Nodes")
for agent, url in registry.items():
    st.sidebar.text(f"✅ {agent}")

query = st.chat_input("Enter your query...")

if "messages" not in st.session_state:
    st.session_state.messages = []

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if query:
    st.session_state.messages.append({"role": "user", "content": query})
    with st.chat_message("user"):
        st.markdown(query)
        
    target_agent = get_target_agent(query, mode)
    
    if target_agent not in registry:
        with st.chat_message("assistant"):
            st.error(f"Target agent '{target_agent}' is not running.")
    else:
        with st.chat_message("assistant"):
            with st.spinner(f"Routing to {target_agent}..."):
                payload = {
                    "request_id": str(uuid.uuid4()),
                    "query": query,
                    "context": {}
                }
                url = registry[target_agent]
                
                # Streamlit is sync, so we need to run asyncio event loop
                response = asyncio.run(call_agent(url, payload))
                
                st.markdown(response.answer)
                if response.metadata:
                    with st.expander("Metadata"):
                        st.json(response.metadata)
                        
                st.session_state.messages.append({"role": "assistant", "content": response.answer})
