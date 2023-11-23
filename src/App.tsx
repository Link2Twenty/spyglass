import { useState, useEffect, useRef } from "react";

import useLocalStorage from "@blocdigital/uselocalstorage";
import { mapClassesCurried } from "@blocdigital/useclasslist";

import maps from "./main.module.scss";

const mc = mapClassesCurried(maps, true) as (cls: string) => string;

// get page id
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

interface windowPos {
  top: number;
  left: number;
  height: number;
  width: number;
}

function App() {
  const storage = useLocalStorage("local");

  const containerRef = useRef<HTMLDivElement>(null);

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [table, setTable] = useState<{ key: string; data: windowPos }[]>([]);

  /**
   * change the image across all tabs
   */
  const getImage = async () => {
    const { currentScreen: cs } = await (window as any).getScreenDetails();

    const { url } = await fetch(
      `https://picsum.photos/${cs.availWidth}/${cs.availHeight}`
    );

    storage.set("image", url);
  };

  // init local storage
  useEffect(() => {
    if (!storage) return;

    const list = storage.get("windows");

    if (!list) storage.init("windows", []);
  }, [storage]);

  // keep imgSrc in sync
  useEffect(() => {
    if (!storage) return;

    const setImage = (key: string) => {
      if (key !== "image") return;

      setImgSrc(storage.get(key) as string);
    };

    setImage("image");

    storage.on("set", setImage);

    return () => storage.off("set", setImage);
  }, [storage]);

  // handle animation loop
  useEffect(() => {
    if (!id || !storage) return;

    const ac = new AbortController();
    const { current: el } = containerRef;

    if (!el) return;

    const animate = () => {
      const { screenLeft, screenTop, outerHeight, outerWidth } = window;
      el.style.setProperty("--top", String(screenTop));
      el.style.setProperty("--left", String(screenLeft));

      const { top, left, height, width } = (storage.get(id) as windowPos) || {};

      if (
        top !== screenTop ||
        left !== screenLeft ||
        height !== outerHeight ||
        width !== outerWidth
      )
        storage.set(id, {
          top: screenTop,
          left: screenLeft,
          height: outerHeight,
          width: outerWidth,
        });

      if (ac.signal.aborted) return;

      window.requestAnimationFrame(() => animate());
    };

    window.requestAnimationFrame(() => animate());

    return () => ac.abort();
  }, [storage]);

  // handle putting self in window tab
  useEffect(() => {
    if (!id || !storage) return;

    // add self to list
    const windows: string[] = (storage.get("windows") as string[]) || [];
    storage.set("windows", Array.from(new Set([...windows, id])));

    const removeSelf = () => {
      const windows: string[] = (storage.get("windows") as string[]) || [];
      storage.set(
        "windows",
        windows.filter((w) => w !== id)
      );
      storage.remove(id);
    };

    window.addEventListener("beforeunload", removeSelf);

    return () => window.removeEventListener("beforeunload", removeSelf);
  }, [storage]);

  // track table
  useEffect(() => {
    if (id || !storage) return;

    const handleChange = () => {
      const list = (storage.get("windows") as string[]) || ([] as string[]);
      setTable(
        list.map((key) => ({ key, data: storage.get(key) as windowPos }))
      );
    };

    handleChange();

    storage.on("set", handleChange);

    return () => storage.off("set", handleChange);
  }, [storage]);

  return (
    <div ref={containerRef} className={mc(id ? "child" : "parent")}>
      {id ? (
        imgSrc && <img draggable="false" src={imgSrc} />
      ) : (
        <>
          {Boolean(table.length) && (
            <table>
              <thead>
                <tr>
                  <th>id</th>
                  <th>top</th>
                  <th>left</th>
                  <th>width</th>
                  <th>height</th>
                </tr>
              </thead>
              <tbody>
                {table.map(({ key, data }) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{data?.top}</td>
                    <td>{data?.left}</td>
                    <td>{data?.width}</td>
                    <td>{data?.height}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            onClick={async () => {
              const { currentScreen: cs } = await (
                window as any
              ).getScreenDetails();

              const image = storage.get("image");
              if (!image) getImage();

              window.open(
                `./?id=${Math.random().toString(16).slice(2)}`,
                "_blank",
                `left=${cs.availLeft + cs.availWidth * 0.25},
            top=${cs.availTop + cs.availHeight * 0.25},
            width=${cs.availWidth * 0.5},
            height=${cs.availHeight * 0.5}`
              );
            }}
          >
            Open window
          </button>
        </>
      )}
    </div>
  );
}

export default App;
