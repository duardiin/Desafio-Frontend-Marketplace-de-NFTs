import { createCn } from "cn/config"

/**
 * `cn` com a escala tipográfica e os raios do Figma registrados.
 * Sem isso, `text-body-16` seria tratado como cor de texto e descartado
 * ao ser combinado com `text-primary-foreground`, por exemplo.
 *
 * Componentes adicionados pelo CLI do shadcn importam `cn` do pacote "cn":
 * troque o import para "@/lib/utils".
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "heading-28",
            "heading-24",
            "heading-22",
            "body-18",
            "body-17",
            "body-16",
            "body-15",
            "body-14",
            "caption-13",
            "caption-12",
            "tiny-10",
            "tiny-9",
          ],
        },
      ],
      rounded: [{ rounded: ["banner"] }],
      tracking: [{ tracking: ["brand"] }],
    },
  },
})
