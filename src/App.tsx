import { CatPet } from './components/CatPet';
import { ChatBubble } from './components/ChatBubble';

function App() {
  return (
    <div className="w-screen h-screen relative">
      <CatPet />
      <ChatBubble onInteract={() => {}} />
    </div>
  );
}

export default App;
