import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";

const catalogs = { en, tr } as const;

export type TestLocale = keyof typeof catalogs;

export function messagesFor(locale: TestLocale) {
  return catalogs[locale];
}

interface RenderWithIntlOptions extends Omit<RenderOptions, "wrapper"> {
  locale?: TestLocale;
}

/**
 * Renders a client component under the real message catalogs instead of a
 * hand written subset, so a render test fails the moment a key it reaches
 * for goes missing from messages/*.json, the same way the app would.
 */
export function renderWithIntl(
  ui: ReactElement,
  { locale = "en", ...options }: RenderWithIntlOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider
        locale={locale}
        messages={catalogs[locale]}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

function isAsyncFunctionComponent(
  type: unknown
): type is (props: unknown) => Promise<ReactNode> {
  return (
    typeof type === "function" &&
    (type as { constructor: { name: string } }).constructor.name ===
      "AsyncFunction"
  );
}

async function resolveNode(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) {
    return Promise.all(node.map((child) => resolveNode(child)));
  }
  if (!isValidElement(node)) {
    return node;
  }

  const element = node as ReactElement<{ children?: ReactNode }>;
  if (isAsyncFunctionComponent(element.type)) {
    const rendered = await element.type(element.props);
    return resolveNode(rendered);
  }

  if (
    element.props &&
    typeof element.props === "object" &&
    "children" in element.props
  ) {
    const children = await resolveNode(element.props.children);
    return cloneElement(element, undefined, children);
  }

  return element;
}

/**
 * React Server Components (async function components, `await getData()`
 * before returning JSX) are an RSC-only feature: React DOM's client
 * renderer cannot mount them directly, `render(<AsyncThing />)` throws.
 * This walks the tree ahead of `render`, awaiting every async function
 * component it finds (recursively, since Systems -> Suspense -> SystemsPanel
 * nests one inside another) and leaving every ordinary sync component
 * exactly as JSX describes it, so the parts that matter to a render test
 * (hooks, event handlers) still run through React's own renderer.
 */
export async function resolveServerTree(node: ReactNode): Promise<ReactNode> {
  return resolveNode(node);
}
