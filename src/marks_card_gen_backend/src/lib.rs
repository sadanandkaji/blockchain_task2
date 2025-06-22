use ic_cdk::api::caller;
use ic_cdk_macros::{update, query};
use std::cell::RefCell;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use candid::{CandidType, Principal};

thread_local! {
    static REPORTS: RefCell<HashMap<Principal, Vec<ReportCard>>> = RefCell::new(HashMap::new());
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
pub struct ReportCard {
    pub student_name: String,
    pub total_marks: u32,
    pub num_subjects: u32,
    pub average: f32,
    pub grade: String,
}

impl ReportCard {
    pub fn new(student_name: String, total_marks: u32, num_subjects: u32) -> Self {
        let average = total_marks as f32 / num_subjects as f32;
        let grade = if average >= 90.0 {
            "A".to_string()
        } else if average >= 75.0 {
            "B".to_string()
        } else if average >= 60.0 {
            "C".to_string()
        } else {
            "D".to_string()
        };

        ReportCard {
            student_name,
            total_marks,
            num_subjects,
            average,
            grade,
        }
    }
}

#[update]
fn store_report_card(student_name: String, total_marks: u32, num_subjects: u32) {
    let report = ReportCard::new(student_name, total_marks, num_subjects);
    let user = caller();

    REPORTS.with(|reports| {
        let mut reports = reports.borrow_mut();
        reports.entry(user).or_insert_with(Vec::new).push(report);
    });
}

#[query]
fn get_my_reports() -> Vec<ReportCard> {
    let user = caller();

    REPORTS.with(|reports| {
        reports
            .borrow()
            .get(&user)
            .cloned()
            .unwrap_or_else(Vec::new)
    })
}
