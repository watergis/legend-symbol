import {cache, loadImage, loadJson} from '../src/util';

export default function reactish (legendSymbol, createElement, {useState, useEffect}) {
  function attrReplace (attrs) {
    const out = {};
    Object.entries(attrs).forEach(([k, v]) => {
      k = k.replace(/-./g, (i) => {
        return i.slice(1).toUpperCase();
      });
      out[k] = v;
    });
    return out;
  }

  /**
   * Turns a JSON tree into react components
   */
  function asReact (tree) {
    if (!tree) return null;
    return createElement(
      tree.element,
      attrReplace(tree.attributes),
      (tree.children ? tree.children.map(asReact) : undefined)
    );
  }

  return function Component (props) {
    const {zoom, layer} = props;
    const spriteUrl = props.sprite;
    const [sprite, setSprite] = useState(null);

    useEffect(() => {
      let promise;
      if (spriteUrl) {
        const existing = cache.fetch(spriteUrl);
        if (existing) {
          existing.then(([image, json]) => {
            setSprite({
              image,
              json
            });
          });
        }
        else {
          promise = Promise.all([
            loadImage(spriteUrl+'@2x.png'),
            loadJson(spriteUrl+'.json'),
          ]);
          cache.add(spriteUrl, promise);
          promise.then(([image, json]) => {
            setSprite({
              image,
              json
            });
          });

          return () => {
            cache.release(spriteUrl);
          }
        }
      }
    }, [spriteUrl]);

    const tree = legendSymbol({sprite, zoom, layer});
    return asReact(tree);

  }
}
