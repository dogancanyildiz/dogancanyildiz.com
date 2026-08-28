import type { ComponentProps, ComponentType } from "react";

/**
 * Element overrides handed to every compiled MDX body.
 *
 * The two shortcodes that used to live here (ProjectMeta, Screenshot) were
 * removed: no content file ever used them, they were not part of the content
 * strategy in docs/08-icerik-stratejisi.md or the Faz 4 plan, and reaching
 * them through the component map cost two `as unknown as` casts. If a case
 * study needs an in-body meta grid later, it should arrive with the content
 * that needs it and with translated labels.
 */

/**
 * A table wider than the prose column has to scroll inside its own box.
 * Without the wrapper the whole document scrolls sideways on a phone, which
 * moves the body text out from under the reader.
 */
function MdxTable(props: ComponentProps<"table">) {
  // Every prop is forwarded rather than only children: remark hands the table
  // whatever the markdown produced (align, className, a generated id), and
  // dropping those silently changes the rendering of a table that used them.
  return (
    <div className="table-wrap">
      <table {...props} />
    </div>
  );
}

export const mdxComponents: Record<
  string,
  ComponentType<Record<string, unknown>>
> = {
  table: MdxTable,
};
