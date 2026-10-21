import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createReactBlockSpec, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useState } from "react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// A custom React block with local state: the kind of block reported to freeze iOS Safari (BlockNote#2994).
const TaskCard = createReactBlockSpec(
  {
    type: "taskCard",
    propSchema: { title: { default: "Homework 3" }, done: { default: false } },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const [taps, setTaps] = useState(0);
      return (
        <div className="task-card" contentEditable={false}>
          <label>
            <input
              type="checkbox"
              checked={block.props.done}
              onChange={(e) => editor.updateBlock(block, { props: { done: e.target.checked } })}
            />
            <span className={block.props.done ? "done" : ""}>{block.props.title}</span>
          </label>
          <button onClick={() => setTaps((t) => t + 1)}>Tap me ({taps})</button>
        </div>
      );
    },
  },
);

const schema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, taskCard: TaskCard() },
});

export default function Editor() {
  const editor = useCreateBlockNote({
    schema,
    initialContent: [
      { type: "heading", content: "BI-PA2 · Lecture 5 notes" },
      { type: "paragraph", content: "Type here, try the / slash menu, and drag blocks by the ⋮⋮ handle." },
      { type: "taskCard", props: { title: "Hand in homework 3" } },
      { type: "bulletListItem", content: "Templates and RAII" },
      { type: "bulletListItem", content: "Move semantics" },
      { type: "taskCard", props: { title: "Prepare presentation slides" } },
      { type: "checkListItem", content: "Read chapter 4" },
      { type: "paragraph", content: "Last paragraph: drag me above the heading." },
    ],
  });

  const insertCard = () => {
    const last = editor.document.at(-1);
    editor.insertBlocks([{ type: "taskCard", props: { title: `Inserted card ${new Date().toLocaleTimeString()}` } }], last, "after");
  };

  return (
    <div>
      <button className="secondary" onClick={insertCard}>Insert another custom block</button>
      <div className="editor">
        <BlockNoteView editor={editor} theme="light" />
      </div>
    </div>
  );
}
