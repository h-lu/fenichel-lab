# Fenichel Lab

An interactive visual study of Fenichel's three core persistence ideas and the exchange lemma, powered by the exactly solvable slow-fast system:

```text
ẋ = −x
ε ẏ = x − y
```

## Run locally

This is a dependency-free static site. Serve the directory with any static server, for example:

```bash
npx serve .
```

The page includes live controls for `ε`, `x₀`, `y₀`, and `t`; an exact orbit player; guided derivation steps; theorem highlighting; and a toy exchange-lemma section map.
