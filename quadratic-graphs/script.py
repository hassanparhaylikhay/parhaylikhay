from manim import *

# ── Parhaylikhay brand colors ────────────────────────────────────────────────
BG_COLOR   = "#0d1216"
WHITE_TEXT = "#f5f5f3"
MUTED_TEXT = "#b4b2a9"
PL_BLUE    = "#00abfa"
PL_YELLOW  = "#fff067"
PL_PINK    = "#ff4670"
PL_GREEN   = "#0fee89"
AXES_COLOR = "#888780"

FAST    = 0.5
NORMAL  = 1.0
SLOW    = 2.0
PATIENT = 3.0

TITLE_SIZE    = 48
HEADING_SIZE  = 36
BODY_SIZE     = 30
SMALL_SIZE    = 24
EQUATION_SIZE = 40


def pl_axes(x_range, y_range, x_length=7, y_length=5):
    return Axes(
        x_range=x_range, y_range=y_range,
        x_length=x_length, y_length=y_length,
        axis_config={
            "color": AXES_COLOR, "stroke_width": 1.8,
            "include_tip": True, "tip_length": 0.18,
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
class Scene1_Hook(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        ## Scene1_Hook.title
        title = Text("Quadratic Graphs", font_size=TITLE_SIZE, color=PL_BLUE)
        self.play(Write(title), run_time=SLOW)
        self.wait(2)

        corner = Text("Quadratic Graphs", font_size=18, color=MUTED_TEXT)
        corner.to_corner(UL, buff=0.3)
        self.play(Transform(title, corner), run_time=NORMAL)
        self.wait(0.5)

        ## Scene1_Hook.hook_text
        line1 = Text("A ball is thrown into the air.", font_size=BODY_SIZE, color=WHITE_TEXT)
        line2 = Text("What shape does its path make?", font_size=BODY_SIZE, color=MUTED_TEXT)
        VGroup(line1, line2).arrange(DOWN, buff=0.5).shift(UP * 2.0)

        self.play(FadeIn(line1), run_time=NORMAL)
        self.wait(1.5)
        self.play(FadeIn(line2), run_time=NORMAL)
        self.wait(2)

        ## Scene1_Hook.trajectory
        axes = pl_axes([0, 7, 1], [0, 6, 1], x_length=7, y_length=4)
        axes.shift(DOWN * 1.5)
        parabola = axes.plot(
            lambda x: -0.6 * (x - 3.5) ** 2 + 5,
            x_range=[0.3, 6.7], color=PL_BLUE, stroke_width=3,
        )

        self.play(Create(axes), run_time=NORMAL)
        self.play(Create(parabola), run_time=PATIENT)
        self.wait(2)

        ## Scene1_Hook.reveal
        answer = Text(
            "A parabola \u2014 described by a quadratic equation.",
            font_size=SMALL_SIZE, color=PL_YELLOW,
        )
        answer.next_to(axes, DOWN, buff=0.25)
        self.play(FadeIn(answer), run_time=NORMAL)
        self.wait(1.5)

        eq_reveal = MathTex(r"y = ax^2 + bx + c", font_size=EQUATION_SIZE, color=PL_YELLOW)
        eq_reveal.next_to(answer, DOWN, buff=0.3)
        self.play(Write(eq_reveal), run_time=SLOW)
        self.wait(3)

        self.play(FadeOut(*self.mobjects), run_time=1.5)
        self.wait(0.5)


# ─────────────────────────────────────────────────────────────────────────────
class Scene2_Foundation(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        ## Scene2_Foundation.title
        title = Text("The Standard Form", font_size=TITLE_SIZE, color=PL_BLUE)
        self.play(Write(title), run_time=SLOW)
        self.wait(1.5)

        corner = Text("Foundation", font_size=18, color=MUTED_TEXT).to_corner(UL, buff=0.3)
        self.play(Transform(title, corner), run_time=NORMAL)
        self.wait(0.5)

        ## Scene2_Foundation.equation — term by term
        eq = MathTex(
            r"y", r"=",
            r"a", r"x^2",
            r"+", r"b", r"x",
            r"+", r"c",
            font_size=EQUATION_SIZE, color=WHITE_TEXT,
        )
        eq.shift(UP * 1.8)

        for part in eq:
            self.play(Write(part), run_time=0.7)
            self.wait(0.3)
        self.wait(2)

        ## Scene2_Foundation.braces
        brace_a = Brace(VGroup(eq[2], eq[3]), DOWN, color=PL_BLUE, buff=0.1)
        lbl_a = Text("controls shape\nand direction", font_size=SMALL_SIZE - 2, color=PL_BLUE)
        lbl_a.next_to(brace_a, DOWN, buff=0.15)

        brace_b = Brace(VGroup(eq[5], eq[6]), DOWN, color=PL_YELLOW, buff=0.1)
        lbl_b = Text("shifts the axis\nof symmetry", font_size=SMALL_SIZE - 2, color=PL_YELLOW)
        lbl_b.next_to(brace_b, DOWN, buff=0.15)

        brace_c = Brace(eq[8], DOWN, color=PL_GREEN, buff=0.1)
        lbl_c = Text("y-intercept", font_size=SMALL_SIZE - 2, color=PL_GREEN)
        lbl_c.next_to(brace_c, DOWN, buff=0.15)

        self.play(GrowFromCenter(brace_a), FadeIn(lbl_a), run_time=NORMAL)
        self.wait(2)
        self.play(GrowFromCenter(brace_b), FadeIn(lbl_b), run_time=NORMAL)
        self.wait(2)
        self.play(GrowFromCenter(brace_c), FadeIn(lbl_c), run_time=NORMAL)
        self.wait(2.5)

        self.play(
            FadeOut(brace_a, lbl_a, brace_b, lbl_b, brace_c, lbl_c, eq),
            run_time=NORMAL,
        )
        self.wait(0.5)

        ## Scene2_Foundation.simplest
        note = Text(
            "The simplest case:  a = 1,  b = 0,  c = 0",
            font_size=BODY_SIZE, color=MUTED_TEXT,
        )
        note.shift(UP * 1.5)
        simple_eq = MathTex(r"y = x^2", font_size=EQUATION_SIZE + 4, color=PL_BLUE)
        simple_eq.next_to(note, DOWN, buff=0.4)

        self.play(FadeIn(note), run_time=NORMAL)
        self.play(Write(simple_eq), run_time=SLOW)
        self.wait(1.5)

        axes = pl_axes([-3, 3, 1], [-1, 7, 1], x_length=5.5, y_length=3.8)
        axes.shift(DOWN * 1.8)
        curve = axes.plot(
            lambda x: x ** 2, x_range=[-2.5, 2.5],
            color=PL_BLUE, stroke_width=3,
        )

        self.play(Create(axes), run_time=NORMAL)
        self.play(Create(curve), run_time=SLOW)
        self.wait(3)

        self.play(FadeOut(*self.mobjects), run_time=1.5)
        self.wait(0.5)


# ─────────────────────────────────────────────────────────────────────────────
class Scene3_CoreConcept(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        ## Scene3_CoreConcept.title
        title = Text("How a and c Change the Parabola", font_size=HEADING_SIZE, color=PL_BLUE)
        self.play(Write(title), run_time=SLOW)
        self.wait(1.5)
        corner = Text("Core Concept", font_size=18, color=MUTED_TEXT).to_corner(UL, buff=0.3)
        self.play(Transform(title, corner), run_time=NORMAL)

        axes = pl_axes([-4, 4, 1], [-5, 9, 1], x_length=7, y_length=5)
        axes.shift(RIGHT * 1.5 + DOWN * 0.3)
        self.play(Create(axes), run_time=NORMAL)
        self.wait(0.5)

        ## Scene3_CoreConcept.effect_of_a
        head_a = Text("Effect of  a", font_size=SMALL_SIZE, color=PL_BLUE)
        head_a.move_to(LEFT * 4.5 + UP * 3.0)
        self.play(FadeIn(head_a), run_time=NORMAL)
        self.wait(0.5)

        # a = 1
        c1 = axes.plot(lambda x: x ** 2, x_range=[-3, 3], color=PL_BLUE, stroke_width=3)
        l1 = MathTex(r"y = x^2", font_size=SMALL_SIZE + 2, color=PL_BLUE)
        l1.move_to(LEFT * 4.5 + UP * 2.3)
        self.play(Create(c1), Write(l1), run_time=SLOW)
        self.wait(2)

        # a = 2 — narrower
        c2 = axes.plot(lambda x: 2 * x ** 2, x_range=[-2.1, 2.1], color=PL_BLUE, stroke_width=3)
        l2 = MathTex(r"y = 2x^2", font_size=SMALL_SIZE + 2, color=PL_BLUE)
        l2.move_to(LEFT * 4.5 + UP * 2.3)
        note2 = Text("narrower", font_size=SMALL_SIZE - 4, color=MUTED_TEXT)
        note2.next_to(l2, DOWN, buff=0.15)
        self.play(Transform(c1, c2), Transform(l1, l2), run_time=PATIENT)
        self.play(FadeIn(note2), run_time=FAST)
        self.wait(2)

        # a = 0.5 — wider
        c3 = axes.plot(lambda x: 0.5 * x ** 2, x_range=[-3, 3], color=PL_BLUE, stroke_width=3)
        l3 = MathTex(r"y = 0.5x^2", font_size=SMALL_SIZE + 2, color=PL_BLUE)
        l3.move_to(LEFT * 4.5 + UP * 2.3)
        note3 = Text("wider", font_size=SMALL_SIZE - 4, color=MUTED_TEXT)
        note3.next_to(l3, DOWN, buff=0.15)
        self.play(Transform(c1, c3), Transform(l1, l3), FadeOut(note2), run_time=PATIENT)
        self.play(FadeIn(note3), run_time=FAST)
        self.wait(2)

        # a = -1 — flipped
        c4 = axes.plot(lambda x: -(x ** 2), x_range=[-2.8, 2.8], color=PL_PINK, stroke_width=3)
        l4 = MathTex(r"y = -x^2", font_size=SMALL_SIZE + 2, color=PL_PINK)
        l4.move_to(LEFT * 4.5 + UP * 2.3)
        note4 = Text("flipped! opens downward", font_size=SMALL_SIZE - 4, color=PL_PINK)
        note4.next_to(l4, DOWN, buff=0.15)
        self.play(Transform(c1, c4), Transform(l1, l4), FadeOut(note3), run_time=PATIENT)
        self.play(FadeIn(note4), run_time=NORMAL)
        self.wait(2.5)

        self.play(FadeOut(c1, l1, note4, head_a), run_time=NORMAL)
        self.wait(0.5)

        ## Scene3_CoreConcept.effect_of_c
        head_c = Text("Effect of  c  (the y-intercept)", font_size=SMALL_SIZE, color=PL_GREEN)
        head_c.move_to(LEFT * 4.5 + UP * 3.0)
        self.play(FadeIn(head_c), run_time=NORMAL)
        self.wait(0.5)

        # c = 0
        g1 = axes.plot(lambda x: x ** 2, x_range=[-3, 3], color=PL_GREEN, stroke_width=3)
        m1 = MathTex(r"y = x^2", font_size=SMALL_SIZE + 2, color=PL_GREEN)
        m1.move_to(LEFT * 4.5 + UP * 2.3)
        self.play(Create(g1), Write(m1), run_time=SLOW)
        self.wait(1.5)

        # c = 3 — shifts up
        g2 = axes.plot(lambda x: x ** 2 + 3, x_range=[-2.4, 2.4], color=PL_GREEN, stroke_width=3)
        m2 = MathTex(r"y = x^2 + 3", font_size=SMALL_SIZE + 2, color=PL_GREEN)
        m2.move_to(LEFT * 4.5 + UP * 2.3)
        p2 = Text("shifts up", font_size=SMALL_SIZE - 4, color=MUTED_TEXT)
        p2.next_to(m2, DOWN, buff=0.15)
        self.play(Transform(g1, g2), Transform(m1, m2), run_time=PATIENT)
        self.play(FadeIn(p2), run_time=FAST)
        self.wait(2)

        # c = -2 — shifts down
        g3 = axes.plot(lambda x: x ** 2 - 2, x_range=[-3, 3], color=PL_GREEN, stroke_width=3)
        m3 = MathTex(r"y = x^2 - 2", font_size=SMALL_SIZE + 2, color=PL_GREEN)
        m3.move_to(LEFT * 4.5 + UP * 2.3)
        p3 = Text("shifts down", font_size=SMALL_SIZE - 4, color=MUTED_TEXT)
        p3.next_to(m3, DOWN, buff=0.15)
        self.play(Transform(g1, g3), Transform(m1, m3), FadeOut(p2), run_time=PATIENT)
        self.play(FadeIn(p3), run_time=FAST)
        self.wait(2.5)

        self.play(FadeOut(*self.mobjects), run_time=1.5)
        self.wait(0.5)


# ─────────────────────────────────────────────────────────────────────────────
class Scene4_Example1(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        ## Scene4_Example1.title
        title = Text("Example 1", font_size=TITLE_SIZE, color=PL_YELLOW)
        self.play(Write(title), run_time=SLOW)
        self.wait(1.5)
        corner = Text("Example 1", font_size=18, color=MUTED_TEXT).to_corner(UL, buff=0.3)
        self.play(Transform(title, corner), run_time=NORMAL)

        ## Scene4_Example1.question
        q1 = Text("Sketch the curve:", font_size=BODY_SIZE, color=WHITE_TEXT)
        q_eq = MathTex(r"y = x^2 - 4x + 3", font_size=EQUATION_SIZE, color=WHITE_TEXT)
        q2 = Text("Find where it crosses the x-axis.", font_size=BODY_SIZE, color=MUTED_TEXT)
        VGroup(q1, q_eq, q2).arrange(DOWN, buff=0.3).to_edge(UP, buff=0.7)

        self.play(FadeIn(q1), Write(q_eq), run_time=NORMAL)
        self.play(FadeIn(q2), run_time=NORMAL)
        self.wait(2)

        ## Scene4_Example1.step1 — y-intercept
        s1h = Text("Step 1 \u2014 y-intercept (set x = 0):", font_size=SMALL_SIZE, color=PL_GREEN)
        s1h.to_edge(LEFT, buff=0.4).shift(UP * 1.5)
        s1 = MathTex(
            r"y = 0 - 0 + 3 \;\Rightarrow\; y\text{-int} = 3",
            font_size=SMALL_SIZE + 2, color=WHITE_TEXT,
        )
        s1.next_to(s1h, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        self.play(FadeIn(s1h), run_time=NORMAL)
        self.play(Write(s1), run_time=SLOW)
        self.wait(2)

        ## Scene4_Example1.step2 — x-intercepts
        s2h = Text(
            "Step 2 \u2014 x-intercepts (set y = 0, factorise):",
            font_size=SMALL_SIZE, color=PL_GREEN,
        )
        s2h.next_to(s1, DOWN, buff=0.35).to_edge(LEFT, buff=0.4)

        s2a = MathTex(r"x^2 - 4x + 3 = 0", font_size=SMALL_SIZE + 2, color=WHITE_TEXT)
        s2a.next_to(s2h, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        s2b = MathTex(r"(x - 1)(x - 3) = 0", font_size=SMALL_SIZE + 2, color=PL_YELLOW)
        s2b.next_to(s2a, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        s2c = MathTex(
            r"x = 1 \quad \text{or} \quad x = 3",
            font_size=SMALL_SIZE + 4, color=PL_GREEN,
        )
        s2c.next_to(s2b, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        self.play(FadeIn(s2h), run_time=NORMAL)
        self.play(Write(s2a), run_time=SLOW)
        self.wait(1.5)
        self.play(Write(s2b), run_time=SLOW)
        self.wait(1.5)
        self.play(Write(s2c), run_time=SLOW)
        self.wait(1)
        self.play(Circumscribe(s2c, color=PL_GREEN), run_time=2)
        self.wait(2)

        ## Scene4_Example1.graph
        axes = pl_axes([-1, 5, 1], [-2, 5, 1], x_length=5, y_length=3.8)
        axes.to_edge(RIGHT, buff=0.4).shift(DOWN * 0.6)
        curve = axes.plot(
            lambda x: x ** 2 - 4 * x + 3,
            x_range=[-0.3, 4.3], color=PL_BLUE, stroke_width=2.5,
        )
        d_y  = Dot(axes.c2p(0, 3), color=PL_GREEN,  radius=0.09)
        d_x1 = Dot(axes.c2p(1, 0), color=PL_YELLOW, radius=0.09)
        d_x2 = Dot(axes.c2p(3, 0), color=PL_YELLOW, radius=0.09)

        lb_y  = MathTex(r"(0,3)", font_size=20, color=PL_GREEN).next_to(d_y,  LEFT,  buff=0.1)
        lb_x1 = MathTex(r"(1,0)", font_size=20, color=PL_YELLOW).next_to(d_x1, DOWN, buff=0.1)
        lb_x2 = MathTex(r"(3,0)", font_size=20, color=PL_YELLOW).next_to(d_x2, DOWN, buff=0.1)

        self.play(Create(axes), run_time=NORMAL)
        self.play(Create(curve), run_time=SLOW)
        self.play(FadeIn(d_y, d_x1, d_x2), run_time=NORMAL)
        self.play(Write(lb_y), Write(lb_x1), Write(lb_x2), run_time=NORMAL)
        self.wait(3)

        self.play(FadeOut(*self.mobjects), run_time=1.5)
        self.wait(0.5)


# ─────────────────────────────────────────────────────────────────────────────
class Scene5_Example2(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        ## Scene5_Example2.title
        title = Text("Example 2 \u2014 Negative  a", font_size=TITLE_SIZE, color=PL_YELLOW)
        self.play(Write(title), run_time=SLOW)
        self.wait(1.5)
        corner = Text("Example 2", font_size=18, color=MUTED_TEXT).to_corner(UL, buff=0.3)
        self.play(Transform(title, corner), run_time=NORMAL)

        ## Scene5_Example2.question
        q1 = Text("Sketch the curve:", font_size=BODY_SIZE, color=WHITE_TEXT)
        q_eq = MathTex(r"y = -x^2 + 2x + 3", font_size=EQUATION_SIZE, color=WHITE_TEXT)
        q2 = Text("Find the roots and the vertex.", font_size=BODY_SIZE, color=MUTED_TEXT)
        VGroup(q1, q_eq, q2).arrange(DOWN, buff=0.3).to_edge(UP, buff=0.7)

        self.play(FadeIn(q1), Write(q_eq), FadeIn(q2), run_time=NORMAL)
        self.wait(2)

        ## Scene5_Example2.note_a
        note_a = Text(
            "a = \u22121  \u2192  parabola opens downward.",
            font_size=SMALL_SIZE, color=PL_PINK,
        )
        note_a.to_edge(LEFT, buff=0.4).shift(UP * 1.5)
        self.play(FadeIn(note_a), run_time=NORMAL)
        self.wait(1.5)

        ## Scene5_Example2.roots
        r_h = Text("Roots \u2014 set y = 0:", font_size=SMALL_SIZE, color=PL_GREEN)
        r_h.next_to(note_a, DOWN, buff=0.3).to_edge(LEFT, buff=0.4)

        ra = MathTex(
            r"-x^2 + 2x + 3 = 0 \;\Rightarrow\; x^2 - 2x - 3 = 0",
            font_size=SMALL_SIZE, color=WHITE_TEXT,
        )
        ra.next_to(r_h, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        rb = MathTex(r"(x - 3)(x + 1) = 0", font_size=SMALL_SIZE + 2, color=PL_YELLOW)
        rb.next_to(ra, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        rc = MathTex(
            r"x = 3 \quad \text{or} \quad x = -1",
            font_size=SMALL_SIZE + 4, color=PL_GREEN,
        )
        rc.next_to(rb, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        self.play(FadeIn(r_h), run_time=NORMAL)
        self.play(Write(ra), run_time=SLOW)
        self.wait(1.5)
        self.play(Write(rb), run_time=SLOW)
        self.wait(1.5)
        self.play(Write(rc), run_time=SLOW)
        self.play(Circumscribe(rc, color=PL_GREEN), run_time=2)
        self.wait(1.5)

        ## Scene5_Example2.vertex
        v_h = Text("Vertex \u2014 axis of symmetry  x = \u2212b \u00f7 2a:", font_size=SMALL_SIZE, color=PL_BLUE)
        v_h.next_to(rc, DOWN, buff=0.3).to_edge(LEFT, buff=0.4)

        va = MathTex(
            r"x = \frac{-2}{2 \times (-1)} = 1",
            font_size=SMALL_SIZE + 2, color=WHITE_TEXT,
        )
        va.next_to(v_h, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        vb = MathTex(
            r"y = -(1)^2 + 2(1) + 3 = 4",
            font_size=SMALL_SIZE + 2, color=WHITE_TEXT,
        )
        vb.next_to(va, DOWN, buff=0.15).to_edge(LEFT, buff=0.4)

        vc = MathTex(r"\text{Vertex} = (1,\; 4)", font_size=SMALL_SIZE + 4, color=PL_BLUE)
        vc.next_to(vb, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        self.play(FadeIn(v_h), run_time=NORMAL)
        self.play(Write(va), run_time=SLOW)
        self.wait(1.5)
        self.play(Write(vb), run_time=SLOW)
        self.wait(1.5)
        self.play(Write(vc), run_time=SLOW)
        self.play(Circumscribe(vc, color=PL_BLUE), run_time=2)
        self.wait(2)

        ## Scene5_Example2.graph
        axes = pl_axes([-2, 4, 1], [-2, 6, 1], x_length=4.5, y_length=3.8)
        axes.to_edge(RIGHT, buff=0.4).shift(DOWN * 0.3)
        curve = axes.plot(
            lambda x: -(x ** 2) + 2 * x + 3,
            x_range=[-1, 3], color=PL_PINK, stroke_width=2.5,
        )
        d_v  = Dot(axes.c2p(1,  4), color=PL_BLUE,  radius=0.09)
        d_r1 = Dot(axes.c2p(-1, 0), color=PL_GREEN, radius=0.09)
        d_r2 = Dot(axes.c2p(3,  0), color=PL_GREEN, radius=0.09)

        lb_v  = MathTex(r"(1,4)",  font_size=18, color=PL_BLUE).next_to(d_v,  UP,   buff=0.1)
        lb_r1 = MathTex(r"(-1,0)", font_size=18, color=PL_GREEN).next_to(d_r1, DOWN, buff=0.1)
        lb_r2 = MathTex(r"(3,0)",  font_size=18, color=PL_GREEN).next_to(d_r2, DOWN, buff=0.1)

        self.play(Create(axes), run_time=NORMAL)
        self.play(Create(curve), run_time=SLOW)
        self.play(FadeIn(d_v, d_r1, d_r2), run_time=NORMAL)
        self.play(Write(lb_v), Write(lb_r1), Write(lb_r2), run_time=NORMAL)
        self.wait(3)

        self.play(FadeOut(*self.mobjects), run_time=1.5)
        self.wait(0.5)


# ─────────────────────────────────────────────────────────────────────────────
class Scene6_Example3(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        ## Scene6_Example3.title
        title = Text("Example 3 \u2014 Exam Level", font_size=TITLE_SIZE, color=PL_YELLOW)
        self.play(Write(title), run_time=SLOW)
        self.wait(1.5)
        corner = Text("Example 3", font_size=18, color=MUTED_TEXT).to_corner(UL, buff=0.3)
        self.play(Transform(title, corner), run_time=NORMAL)

        ## Scene6_Example3.question — Cambridge style
        q_box = Rectangle(
            width=11.5, height=1.2,
            fill_color=PL_BLUE, fill_opacity=0.08,
            stroke_color=PL_BLUE, stroke_width=1.5,
        ).shift(UP * 3.1)
        q_txt = Text(
            "(a)  Solve  2x\u00b2 + x \u2212 6 = 0",
            font_size=BODY_SIZE, color=WHITE_TEXT,
        )
        q_txt.move_to(q_box.get_left() + RIGHT * 3.0)
        q_marks = Text("[3]", font_size=BODY_SIZE, color=MUTED_TEXT)
        q_marks.move_to(q_box.get_right() + LEFT * 0.9)

        self.play(FadeIn(q_box), Write(q_txt), Write(q_marks), run_time=NORMAL)
        self.wait(2)

        ## Scene6_Example3.solution — grouping method
        h1 = Text(
            "Multiply  a \u00d7 c:  2 \u00d7 (\u22126) = \u221212",
            font_size=SMALL_SIZE, color=MUTED_TEXT,
        )
        h1.to_edge(LEFT, buff=0.4).shift(UP * 1.9)

        h2 = Text(
            "Two numbers that multiply to \u221212 and add to +1:  +4 and \u22123",
            font_size=SMALL_SIZE - 2, color=MUTED_TEXT,
        )
        h2.next_to(h1, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        s1 = MathTex(
            r"2x^2 + 4x - 3x - 6",
            font_size=SMALL_SIZE + 2, color=WHITE_TEXT,
        )
        s1.next_to(h2, DOWN, buff=0.3).to_edge(LEFT, buff=0.4)

        s2 = MathTex(
            r"= 2x(x + 2) - 3(x + 2)",
            font_size=SMALL_SIZE + 2, color=WHITE_TEXT,
        )
        s2.next_to(s1, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        s3 = MathTex(
            r"= (2x - 3)(x + 2) = 0",
            font_size=SMALL_SIZE + 2, color=PL_YELLOW,
        )
        s3.next_to(s2, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        s4 = MathTex(
            r"x = \frac{3}{2} \quad \text{or} \quad x = -2",
            font_size=SMALL_SIZE + 4, color=PL_GREEN,
        )
        s4.next_to(s3, DOWN, buff=0.25).to_edge(LEFT, buff=0.4)

        self.play(FadeIn(h1), run_time=NORMAL)
        self.wait(1.5)
        self.play(FadeIn(h2), run_time=NORMAL)
        self.wait(1.5)
        for step in [s1, s2, s3]:
            self.play(Write(step), run_time=SLOW)
            self.wait(1.5)
        self.play(Write(s4), run_time=SLOW)
        self.wait(1)
        self.play(Circumscribe(s4, color=PL_GREEN), run_time=2)
        self.wait(2)

        ## Scene6_Example3.graph
        axes = pl_axes([-3, 3, 1], [-8, 4, 2], x_length=4, y_length=3.5)
        axes.to_edge(RIGHT, buff=0.5).shift(DOWN * 0.4)
        curve = axes.plot(
            lambda x: 2 * x ** 2 + x - 6,
            x_range=[-2.4, 2.0], color=PL_BLUE, stroke_width=2.5,
        )
        d1 = Dot(axes.c2p(1.5,  0), color=PL_GREEN, radius=0.08)
        d2 = Dot(axes.c2p(-2.0, 0), color=PL_GREEN, radius=0.08)
        lb1 = MathTex(r"\tfrac{3}{2}", font_size=18, color=PL_GREEN).next_to(d1, DOWN, buff=0.1)
        lb2 = MathTex(r"-2",           font_size=18, color=PL_GREEN).next_to(d2, DOWN, buff=0.1)

        self.play(Create(axes), run_time=NORMAL)
        self.play(Create(curve), run_time=SLOW)
        self.play(FadeIn(d1, d2), Write(lb1), Write(lb2), run_time=NORMAL)
        self.wait(3)

        self.play(FadeOut(*self.mobjects), run_time=1.5)
        self.wait(0.5)


# ─────────────────────────────────────────────────────────────────────────────
class Scene7_ExamInsight(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        ## Scene7_ExamInsight.title
        title = Text("What the Examiner Marks", font_size=TITLE_SIZE, color=PL_PINK)
        self.play(Write(title), run_time=SLOW)
        self.wait(2)
        corner = Text("Exam Insight", font_size=18, color=MUTED_TEXT).to_corner(UL, buff=0.3)
        self.play(Transform(title, corner), run_time=NORMAL)

        ## Scene7_ExamInsight.question
        q_box = Rectangle(
            width=11.5, height=1.3,
            fill_color=PL_BLUE, fill_opacity=0.1,
            stroke_color=PL_BLUE, stroke_width=1.5,
        ).shift(UP * 3.1)
        q_txt = Text(
            "Solve  x\u00b2 \u2212 5x + 6 = 0",
            font_size=BODY_SIZE, color=WHITE_TEXT,
        )
        q_txt.move_to(q_box.get_left() + RIGHT * 2.8)
        q_marks = Text("[2]", font_size=BODY_SIZE, color=MUTED_TEXT)
        q_marks.move_to(q_box.get_right() + LEFT * 0.9)

        self.play(FadeIn(q_box), Write(q_txt), Write(q_marks), run_time=NORMAL)
        self.wait(2)

        ## Scene7_ExamInsight.mark_scheme
        ms_h = Text("Mark Scheme:", font_size=SMALL_SIZE, color=PL_YELLOW)
        ms_h.to_edge(LEFT, buff=0.4).shift(UP * 2.0)
        self.play(FadeIn(ms_h), run_time=NORMAL)
        self.wait(1)

        # M1 — factorisation
        m1_eq = MathTex(r"(x - 2)(x - 3) = 0", font_size=EQUATION_SIZE - 4, color=WHITE_TEXT)
        m1_eq.next_to(ms_h, DOWN, buff=0.3).to_edge(LEFT, buff=0.4)

        m1_tag = Text("M1 \u2014 correct factorisation method", font_size=SMALL_SIZE - 2, color=PL_GREEN)
        m1_tag.set_y(m1_eq.get_y())
        m1_tag.to_edge(RIGHT, buff=0.4)

        self.play(Write(m1_eq), run_time=SLOW)
        self.wait(1)
        self.play(FadeIn(m1_tag), run_time=NORMAL)
        self.play(Indicate(m1_eq, color=PL_GREEN, scale_factor=1.05), run_time=NORMAL)
        self.wait(2)

        # A1 A1 — roots
        a1_eq = MathTex(
            r"x = 2 \quad \text{and} \quad x = 3",
            font_size=EQUATION_SIZE - 4, color=PL_GREEN,
        )
        a1_eq.next_to(m1_eq, DOWN, buff=0.3).to_edge(LEFT, buff=0.4)

        a1_tag = Text("A1 A1 \u2014 one mark per correct root", font_size=SMALL_SIZE - 2, color=PL_GREEN)
        a1_tag.set_y(a1_eq.get_y())
        a1_tag.to_edge(RIGHT, buff=0.4)

        self.play(Write(a1_eq), run_time=SLOW)
        self.wait(1)
        self.play(FadeIn(a1_tag), run_time=NORMAL)
        self.wait(2)

        # Total
        total = Text("Total: 2 marks", font_size=BODY_SIZE, color=PL_YELLOW)
        total.next_to(a1_eq, DOWN, buff=0.4).to_edge(LEFT, buff=0.4)
        self.play(Write(total), run_time=NORMAL)
        self.wait(1.5)

        ## Scene7_ExamInsight.mistakes
        sep = Line(
            LEFT * 7, RIGHT * 7,
            color=MUTED_TEXT, stroke_width=0.8,
        ).set_opacity(0.35)
        sep.next_to(total, DOWN, buff=0.35)
        self.play(Create(sep), run_time=FAST)

        mk_h = Text("Common mistakes that lose marks:", font_size=SMALL_SIZE, color=PL_PINK)
        mk_h.next_to(sep, DOWN, buff=0.25).to_edge(LEFT, buff=0.4)
        self.play(FadeIn(mk_h), run_time=NORMAL)
        self.wait(1)

        mk1 = Text(
            "\u2717  Skipping the factorised form \u2014 no factorisation shown, M1 not awarded",
            font_size=SMALL_SIZE - 2, color=PL_PINK,
        )
        mk1.next_to(mk_h, DOWN, buff=0.2).to_edge(LEFT, buff=0.4)

        mk2 = Text(
            "\u2717  Writing x = \u22122 or x = \u22123 (sign errors in the factors)",
            font_size=SMALL_SIZE - 2, color=PL_PINK,
        )
        mk2.next_to(mk1, DOWN, buff=0.15).to_edge(LEFT, buff=0.4)

        mk3 = Text(
            "\u2713  ECF: if method was right but arithmetic wrong, you can still earn marks",
            font_size=SMALL_SIZE - 2, color=PL_BLUE,
        )
        mk3.next_to(mk2, DOWN, buff=0.15).to_edge(LEFT, buff=0.4)

        for mk in [mk1, mk2, mk3]:
            self.play(FadeIn(mk), run_time=NORMAL)
            self.wait(1.5)
        self.wait(2)

        self.play(FadeOut(*self.mobjects), run_time=1.5)
        self.wait(0.5)


# ─────────────────────────────────────────────────────────────────────────────
class Scene8_Summary(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        ## Scene8_Summary.title
        title = Text("Summary", font_size=TITLE_SIZE, color=PL_BLUE)
        self.play(Write(title), run_time=SLOW)
        self.wait(1.5)
        self.play(title.animate.to_edge(UP, buff=0.5), run_time=NORMAL)
        self.wait(0.5)

        ## Scene8_Summary.cards
        rules = [
            (r"y = ax^2 + bx + c",                    "Standard form of a quadratic",          PL_BLUE),
            (r"a > 0 \;\Rightarrow\; \cup \text{ shape}", "Positive a: opens upward",           PL_GREEN),
            (r"a < 0 \;\Rightarrow\; \cap \text{ shape}", "Negative a: opens downward",         PL_PINK),
            (r"c = \text{y-intercept}",                "Set x = 0 to find where curve starts",  PL_YELLOW),
            (r"\text{Roots: set } y=0,\text{ factorise}", "x values where curve crosses x-axis", PL_GREEN),
            (r"x_{\text{vertex}} = \dfrac{-b}{2a}",   "x-coordinate of the turning point",      PL_BLUE),
        ]

        cards = VGroup()
        for latex, desc, color in rules:
            rect = Rectangle(
                width=5.5, height=1.55,
                fill_color=color, fill_opacity=0.1,
                stroke_color=color, stroke_width=1.5,
            )
            eq = MathTex(latex, font_size=SMALL_SIZE + 2, color=color)
            eq.move_to(rect.get_center() + UP * 0.27)
            dsc = Text(desc, font_size=SMALL_SIZE - 5, color=MUTED_TEXT)
            dsc.move_to(rect.get_center() + DOWN * 0.38)
            cards.add(VGroup(rect, eq, dsc))

        cards.arrange_in_grid(rows=3, cols=2, buff=0.35)
        cards.next_to(title, DOWN, buff=0.4)

        if cards.height > 5.8:
            cards.scale_to_fit_height(5.8)

        for card in cards:
            self.play(FadeIn(card, shift=UP * 0.25), run_time=NORMAL)
            self.wait(1.5)

        self.wait(2)

        final = Text(
            "These rules appear in almost every quadratic question. Know them cold.",
            font_size=SMALL_SIZE, color=PL_YELLOW,
        )
        final.to_edge(DOWN, buff=0.4)
        self.play(FadeIn(final), run_time=NORMAL)
        self.wait(3)

        self.play(FadeOut(*self.mobjects), run_time=1.5)
        self.wait(0.5)
