import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";

// Velite compiles MDX in "function-body" format: the code runs on the server
// at build time and turns into static HTML. There is no eval in the browser,
// so the CSP does not need unsafe-eval. This file must never get "use client".
function getMDXComponent(code: string): ComponentType<{
  components?: Record<string, ComponentType>;
}> {
  const factory = new Function(code);
  return factory({ ...runtime }).default;
}

interface MDXContentProps {
  code: string;
  components?: Record<string, ComponentType>;
}

export function MDXContent({ code, components }: MDXContentProps) {
  const Component = getMDXComponent(code);
  // The react-hooks static-components rule flags creating a component during
  // render, but this component is a server component that renders once per
  // request with server data (the compiled MDX code) as its identity, not
  // client state that would reset. useMemo is not an option here either,
  // since this file must stay a server component and never get "use client".
  // eslint-disable-next-line react-hooks/static-components
  return <Component components={components} />;
}
