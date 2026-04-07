from manim import *

# Parhaylikhay brand colors
BG_COLOR  = "#0d1216"
PL_BLUE   = "#3b9ef5"
PL_GREEN  = "#3ecf7a"
WHITE_TEXT = "#f5f5f3"

class TestScene(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        # ── Title ──────────────────────────────────────────────────
        title = Text("Parhaylikhay", font_size=52, color=PL_BLUE)
        title.move_to(ORIGIN)

        self.play(Write(title), run_time=1.5)
        self.wait(0.5)

        # Move title to top
        self.play(title.animate.to_edge(UP, buff=0.6), run_time=0.8)
        self.wait(0.3)

        # ── Axes ───────────────────────────────────────────────────
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-0.5, 5, 1],
            x_length=6,
            y_length=4,
            axis_config={"color": "#888780", "stroke_width": 1.5},
        )
        axes.move_to(ORIGIN + DOWN * 0.3)

        self.play(Create(axes), run_time=1.0)
        self.wait(0.3)

        # ── Parabola y = x² ────────────────────────────────────────
        parabola = axes.plot(
            lambda x: x ** 2,
            x_range=[-2.2, 2.2],
            color=PL_BLUE,
            stroke_width=3,
        )

        self.play(Create(parabola), run_time=1.5)
        self.wait(0.3)

        # ── Equation (Text fallback — MathTex requires LaTeX install) ──
        equation = Text("y = x²", font_size=38, color=WHITE_TEXT)
        equation.next_to(axes, DOWN, buff=0.4)

        self.play(Write(equation), run_time=1.0)
        self.wait(1.0)

        # ── Done ───────────────────────────────────────────────────
        self.play(
            FadeOut(parabola),
            FadeOut(axes),
            FadeOut(equation),
            title.animate.move_to(ORIGIN).scale(1.2),
            run_time=1.0,
        )
        self.wait(0.5)
