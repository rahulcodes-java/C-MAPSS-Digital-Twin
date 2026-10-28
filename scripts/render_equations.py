"""
render_equations.py -- Render mathematical equations at 300 dpi using matplotlib mathtext.
Outputs to docs/submission/figures/eq_*.png
"""

import os
import matplotlib.pyplot as plt

os.makedirs('docs/submission/figures', exist_ok=True)


def render_eq(latex_str, out_filename, fontsize=12, figsize=(4, 0.6)):
    plt.style.use('default')
    fig = plt.figure(figsize=figsize, dpi=300)
    fig.patch.set_facecolor('white')
    ax = fig.add_axes([0, 0, 1, 1])
    ax.axis('off')
    ax.text(0.5, 0.5, latex_str, size=fontsize, ha='center', va='center', color='#0f172a')
    plt.savefig(out_filename, dpi=300, bbox_inches='tight', pad_inches=0.04, facecolor='white')
    plt.close()
    print(f"Rendered {out_filename}")


def render_all():
    # Eq 1: Min-Max
    render_eq(
        r"$\tilde{x} = \frac{x - x_{\mathrm{min}}^{\mathrm{train}}}{x_{\mathrm{max}}^{\mathrm{train}} - x_{\mathrm{min}}^{\mathrm{train}}}$",
        "docs/submission/figures/eq_minmax.png",
        fontsize=13,
        figsize=(3.5, 0.5)
    )

    # Eq 2: Stage Mapping
    render_eq(
        r"$y = 0 \ (R > 100), \quad y = 1 \ (30 < R \leq 100), \quad y = 2 \ (R \leq 30)$",
        "docs/submission/figures/eq_stagemap.png",
        fontsize=11.5,
        figsize=(5.5, 0.5)
    )

    # Eq 3: Isolation Forest
    render_eq(
        r"$s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}$",
        "docs/submission/figures/eq_iforest.png",
        fontsize=13,
        figsize=(2.8, 0.5)
    )

    # Eq 4: Shapley Value
    render_eq(
        r"$\phi_i = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} [f_x(S \cup \{i\}) - f_x(S)]$",
        "docs/submission/figures/eq_shap.png",
        fontsize=11.5,
        figsize=(5.0, 0.6)
    )

    # Eq 5: NASA Score
    render_eq(
        r"$S = \sum_{i=1}^{N} s_i, \quad s_i = \exp(-d_i/13) - 1 \ (d_i < 0) \ \mathrm{else} \ \exp(d_i/10) - 1$",
        "docs/submission/figures/eq_nasa.png",
        fontsize=11.0,
        figsize=(5.5, 0.5)
    )


if __name__ == '__main__':
    render_all()
